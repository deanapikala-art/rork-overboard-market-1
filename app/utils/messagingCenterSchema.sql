-- Unified Messaging Center Schema
-- For Overboard Market: Customers ↔ Vendors ↔ Admins

-- Conversations table: tracks all message threads
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Order', 'Support', 'General')),
  order_id TEXT,
  participants JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  is_archived_by TEXT[] DEFAULT '{}',
  CONSTRAINT valid_participants CHECK (jsonb_typeof(participants) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_conversations_conversation_id ON conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_order_id ON conversations(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participants);

-- Messages table: individual messages in threads
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT UNIQUE NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'vendor', 'admin')),
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  system_type TEXT CHECK (system_type IN ('status', 'note') OR system_type IS NULL),
  CONSTRAINT valid_attachments CHECK (jsonb_typeof(attachments) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Read Receipts table: track who read which messages
CREATE TABLE IF NOT EXISTS read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_read_receipts_message_id ON read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user_id ON read_receipts(user_id);

-- Typing Indicators table: real-time typing status
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated_at ON typing_indicators(updated_at);

-- Blocks and Reports table: moderation and safety
CREATE TABLE IF NOT EXISTS blocks_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_taken TEXT NOT NULL DEFAULT 'none' CHECK (action_taken IN ('none', 'muted', 'blocked'))
);

CREATE INDEX IF NOT EXISTS idx_blocks_reports_conversation_id ON blocks_reports(conversation_id);
CREATE INDEX IF NOT EXISTS idx_blocks_reports_reporter_id ON blocks_reports(reporter_id);

-- Canned Replies table: vendor quick replies
CREATE TABLE IF NOT EXISTS canned_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT CHECK (category IN ('shipping', 'policies', 'thanks', 'custom')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canned_replies_vendor_id ON canned_replies(vendor_id);

-- Function to update conversation's updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    updated_at = NOW(),
    last_message_preview = CASE
      WHEN NEW.system_type IS NULL THEN LEFT(NEW.body, 100)
      ELSE last_message_preview
    END,
    last_message_at = NOW()
  WHERE conversation_id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation on new message
DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to clean up old typing indicators (older than 30 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE updated_at < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- Insert default canned replies for vendors
INSERT INTO canned_replies (vendor_id, title, body, category) VALUES
  ('DEFAULT', 'Shipping Update', 'Your order has been shipped! You should receive tracking information shortly.', 'shipping'),
  ('DEFAULT', 'Delayed Shipment', 'We apologize for the delay. Your order will ship within 2-3 business days. Thank you for your patience!', 'shipping'),
  ('DEFAULT', 'Custom Order Quote', 'Thank you for your interest in a custom order! I''d be happy to create something special for you. Let me know your requirements and I''ll provide a quote.', 'custom'),
  ('DEFAULT', 'Return Policy', 'Our return policy: Items can be returned within 14 days of delivery in original condition. Please contact us to initiate a return.', 'policies'),
  ('DEFAULT', 'Thank You', 'Thank you so much for your purchase! I hope you love it. Please don''t hesitate to reach out if you have any questions.', 'thanks'),
  ('DEFAULT', 'Local Pickup', 'Your order is ready for local pickup! Please let me know when you''d like to pick it up and I''ll share the details.', 'shipping')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access conversations they're part of (or admins can see all)
-- Note: You'll need to adjust these based on your auth.users() setup

-- Conversations: visible to participants and admins
CREATE POLICY "Conversations visible to participants and admins"
  ON conversations FOR SELECT
  USING (
    participants::jsonb @> jsonb_build_array(jsonb_build_object('userID', auth.uid()::text))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

-- Messages: visible to conversation participants and admins (excluding internal admin notes for non-admins)
CREATE POLICY "Messages visible to conversation participants"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.conversation_id = messages.conversation_id
      AND (
        conversations.participants::jsonb @> jsonb_build_array(jsonb_build_object('userID', auth.uid()::text))
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_id = auth.uid()::text AND role = 'admin'
        )
      )
    )
    AND (
      messages.system_type != 'note'
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()::text AND role = 'admin'
      )
    )
  );

-- Users can insert messages in conversations they're part of
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.conversation_id = messages.conversation_id
      AND conversations.participants::jsonb @> jsonb_build_array(jsonb_build_object('userID', auth.uid()::text))
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

-- Similar policies for read_receipts, typing_indicators, etc.
CREATE POLICY "Users can mark messages as read"
  ON read_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can see read receipts for their conversations"
  ON read_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON c.conversation_id = m.conversation_id
      WHERE m.message_id = read_receipts.message_id
      AND c.participants::jsonb @> jsonb_build_array(jsonb_build_object('userID', auth.uid()::text))
    )
  );

-- Typing indicators
CREATE POLICY "Users can update their own typing status"
  ON typing_indicators FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Canned replies
CREATE POLICY "Vendors can manage their canned replies"
  ON canned_replies FOR ALL
  USING (vendor_id = auth.uid()::text OR vendor_id = 'DEFAULT')
  WITH CHECK (vendor_id = auth.uid()::text);

COMMENT ON TABLE conversations IS 'Unified messaging: threads between customers, vendors, and admins';
COMMENT ON TABLE messages IS 'Individual messages within conversation threads';
COMMENT ON TABLE read_receipts IS 'Tracks when users read messages';
COMMENT ON TABLE typing_indicators IS 'Real-time typing status for active conversations';
COMMENT ON TABLE blocks_reports IS 'Moderation: user reports and blocks';
COMMENT ON TABLE canned_replies IS 'Vendor quick reply templates';
