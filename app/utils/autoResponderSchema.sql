-- Vendor Auto-Responder Schema
-- For Overboard Market: Automated vendor responses when unavailable

-- Vendor Auto-Responder table: stores auto-reply settings per vendor
CREATE TABLE IF NOT EXISTS vendor_auto_responder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  mode TEXT NOT NULL DEFAULT 'AfterHours' CHECK (mode IN ('Vacation', 'AfterHours', 'AlwaysOn')),
  start_date DATE,
  end_date DATE,
  business_hours JSONB DEFAULT '{"open": "09:00", "close": "17:00", "timezone": "America/Chicago"}'::jsonb,
  message_template TEXT NOT NULL DEFAULT 'Thanks for your message! I''ll respond as soon as I''m available.',
  trigger_types TEXT[] DEFAULT ARRAY['newMessage', 'newOrder'],
  cooldown_hours INTEGER NOT NULL DEFAULT 12,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_business_hours CHECK (jsonb_typeof(business_hours) = 'object'),
  CONSTRAINT valid_cooldown CHECK (cooldown_hours >= 1 AND cooldown_hours <= 72)
);

CREATE INDEX IF NOT EXISTS idx_vendor_auto_responder_vendor_id ON vendor_auto_responder(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_auto_responder_enabled ON vendor_auto_responder(is_enabled) WHERE is_enabled = true;

-- Auto Responder Log: track when auto-replies are sent (for analytics and debugging)
CREATE TABLE IF NOT EXISTS auto_responder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('newMessage', 'newOrder')),
  message_sent TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_responder_log_vendor_id ON auto_responder_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_auto_responder_log_recipient_id ON auto_responder_log(recipient_id);
CREATE INDEX IF NOT EXISTS idx_auto_responder_log_sent_at ON auto_responder_log(sent_at DESC);

-- Function to update vendor_auto_responder's updated_at timestamp
CREATE OR REPLACE FUNCTION update_auto_responder_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_auto_responder_timestamp_trigger ON vendor_auto_responder;
CREATE TRIGGER update_auto_responder_timestamp_trigger
  BEFORE UPDATE ON vendor_auto_responder
  FOR EACH ROW
  EXECUTE FUNCTION update_auto_responder_timestamp();

-- Function to check if auto-responder should trigger
CREATE OR REPLACE FUNCTION should_send_auto_reply(
  p_vendor_id TEXT,
  p_recipient_id TEXT,
  p_trigger_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_responder RECORD;
  v_last_sent TIMESTAMPTZ;
  v_current_time TIME;
  v_current_day TEXT;
  v_open_time TIME;
  v_close_time TIME;
  v_is_within_hours BOOLEAN;
BEGIN
  -- Get responder settings
  SELECT * INTO v_responder
  FROM vendor_auto_responder
  WHERE vendor_id = p_vendor_id AND is_enabled = true;

  -- If not enabled or not found, don't send
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if trigger type is enabled
  IF NOT (p_trigger_type = ANY(v_responder.trigger_types)) THEN
    RETURN false;
  END IF;

  -- Check cooldown period
  SELECT sent_at INTO v_last_sent
  FROM auto_responder_log
  WHERE vendor_id = p_vendor_id 
    AND recipient_id = p_recipient_id
  ORDER BY sent_at DESC
  LIMIT 1;

  IF v_last_sent IS NOT NULL THEN
    IF NOW() - v_last_sent < (v_responder.cooldown_hours || ' hours')::INTERVAL THEN
      RETURN false;
    END IF;
  END IF;

  -- Check mode-specific conditions
  CASE v_responder.mode
    WHEN 'AlwaysOn' THEN
      RETURN true;
    
    WHEN 'Vacation' THEN
      IF v_responder.start_date IS NULL OR v_responder.end_date IS NULL THEN
        RETURN false;
      END IF;
      RETURN CURRENT_DATE BETWEEN v_responder.start_date AND v_responder.end_date;
    
    WHEN 'AfterHours' THEN
      v_current_time := CURRENT_TIME;
      v_open_time := (v_responder.business_hours->>'open')::TIME;
      v_close_time := (v_responder.business_hours->>'close')::TIME;
      
      -- Check if current time is outside business hours
      v_is_within_hours := v_current_time BETWEEN v_open_time AND v_close_time;
      RETURN NOT v_is_within_hours;
    
    ELSE
      RETURN false;
  END CASE;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to send auto-reply (called by application or trigger)
CREATE OR REPLACE FUNCTION send_auto_reply(
  p_vendor_id TEXT,
  p_recipient_id TEXT,
  p_conversation_id TEXT,
  p_trigger_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_responder RECORD;
  v_message TEXT;
  v_message_id TEXT;
BEGIN
  -- Check if should send
  IF NOT should_send_auto_reply(p_vendor_id, p_recipient_id, p_trigger_type) THEN
    RETURN false;
  END IF;

  -- Get responder details
  SELECT * INTO v_responder
  FROM vendor_auto_responder
  WHERE vendor_id = p_vendor_id;

  -- Parse message template (simple version - replace {{returnDate}})
  v_message := v_responder.message_template;
  
  IF v_responder.mode = 'Vacation' AND v_responder.end_date IS NOT NULL THEN
    v_message := REPLACE(v_message, '{{returnDate}}', v_responder.end_date::TEXT);
  END IF;

  -- Generate message ID
  v_message_id := 'MSG-AUTO-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || substr(md5(random()::text), 1, 9);

  -- Insert auto-reply message into messages table
  INSERT INTO messages (
    message_id,
    conversation_id,
    sender_id,
    sender_role,
    body,
    system_type,
    created_at
  ) VALUES (
    v_message_id,
    p_conversation_id,
    p_vendor_id,
    'vendor',
    v_message,
    'status',
    NOW()
  );

  -- Log the auto-reply
  INSERT INTO auto_responder_log (
    vendor_id,
    recipient_id,
    conversation_id,
    trigger_type,
    message_sent,
    sent_at
  ) VALUES (
    p_vendor_id,
    p_recipient_id,
    p_conversation_id,
    p_trigger_type,
    v_message,
    NOW()
  );

  -- Update last triggered timestamp
  UPDATE vendor_auto_responder
  SET last_triggered_at = NOW()
  WHERE vendor_id = p_vendor_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-respond to new messages
CREATE OR REPLACE FUNCTION trigger_auto_reply_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_conv RECORD;
  v_vendor_id TEXT;
BEGIN
  -- Get conversation details
  SELECT * INTO v_conv
  FROM conversations
  WHERE conversation_id = NEW.conversation_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Find vendor in participants (sender_role = 'vendor')
  SELECT p->>'userID' INTO v_vendor_id
  FROM jsonb_array_elements(v_conv.participants) AS p
  WHERE p->>'role' = 'vendor'
  LIMIT 1;

  -- If message is from customer/admin to vendor, try to auto-reply
  IF v_vendor_id IS NOT NULL AND NEW.sender_id != v_vendor_id AND NEW.system_type IS NULL THEN
    PERFORM send_auto_reply(
      v_vendor_id,
      NEW.sender_id,
      NEW.conversation_id,
      'newMessage'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_reply_on_new_message ON messages;
CREATE TRIGGER auto_reply_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_reply_on_message();

-- Enable Row Level Security
ALTER TABLE vendor_auto_responder ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_responder_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Vendors can only manage their own auto-responder
CREATE POLICY "Vendors can view their own auto-responder"
  ON vendor_auto_responder FOR SELECT
  USING (vendor_id = auth.uid()::text);

CREATE POLICY "Vendors can insert their own auto-responder"
  ON vendor_auto_responder FOR INSERT
  WITH CHECK (vendor_id = auth.uid()::text);

CREATE POLICY "Vendors can update their own auto-responder"
  ON vendor_auto_responder FOR UPDATE
  USING (vendor_id = auth.uid()::text)
  WITH CHECK (vendor_id = auth.uid()::text);

-- Admins can view all auto-responders
CREATE POLICY "Admins can view all auto-responders"
  ON vendor_auto_responder FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

-- Auto-responder log policies
CREATE POLICY "Vendors can view their own auto-responder log"
  ON auto_responder_log FOR SELECT
  USING (vendor_id = auth.uid()::text);

CREATE POLICY "Admins can view all auto-responder logs"
  ON auto_responder_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

COMMENT ON TABLE vendor_auto_responder IS 'Vendor auto-reply settings for when they are unavailable';
COMMENT ON TABLE auto_responder_log IS 'Log of all auto-replies sent for analytics and debugging';
COMMENT ON FUNCTION should_send_auto_reply IS 'Checks if auto-reply should be sent based on mode, cooldown, and business hours';
COMMENT ON FUNCTION send_auto_reply IS 'Sends an automated reply and logs it';
