-- ============================================
-- Policy Acknowledgment & Update Notification System
-- ============================================
-- Purpose: Track user policy acknowledgments and notify when policies change

-- Policy Texts Table (stores versioned policy content)
CREATE TABLE IF NOT EXISTS policy_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type TEXT NOT NULL CHECK (policy_type IN ('terms', 'privacy', 'codeOfConduct')),
  version NUMERIC(4,2) NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  requires_acknowledgment BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(policy_type, version)
);

-- User Policy Acknowledgments (tracks which version each user agreed to)
CREATE TABLE IF NOT EXISTS user_policy_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('terms', 'privacy', 'codeOfConduct')),
  acknowledged_version NUMERIC(4,2) NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, policy_type)
);

-- Policy Update Notifications (tracks pending acknowledgments)
CREATE TABLE IF NOT EXISTS policy_update_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id TEXT UNIQUE NOT NULL DEFAULT ('pol_' || gen_random_uuid()::text),
  user_id UUID NOT NULL,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('terms', 'privacy', 'codeOfConduct')),
  old_version NUMERIC(4,2),
  new_version NUMERIC(4,2) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  is_acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Admin Policy Acknowledgment Tracker (summary view)
CREATE TABLE IF NOT EXISTS policy_acknowledgment_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type TEXT NOT NULL CHECK (policy_type IN ('terms', 'privacy', 'codeOfConduct')),
  version NUMERIC(4,2) NOT NULL,
  total_users INTEGER DEFAULT 0,
  acknowledged_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(policy_type, version)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_policy_texts_type_version ON policy_texts(policy_type, version DESC);
CREATE INDEX IF NOT EXISTS idx_policy_texts_active ON policy_texts(policy_type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_acknowledgments_user ON user_policy_acknowledgments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_acknowledgments_type ON user_policy_acknowledgments(policy_type);
CREATE INDEX IF NOT EXISTS idx_policy_notifications_user ON policy_update_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_notifications_pending ON policy_update_notifications(user_id, is_acknowledged) WHERE is_acknowledged = false;

-- Enable RLS
ALTER TABLE policy_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_policy_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_update_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgment_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for policy_texts (everyone can read active policies)
CREATE POLICY "Anyone can read active policy texts"
  ON policy_texts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage policy texts"
  ON policy_texts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.admin_id = auth.uid()
  ));

-- RLS Policies for user_policy_acknowledgments
CREATE POLICY "Users can view their own acknowledgments"
  ON user_policy_acknowledgments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own acknowledgments"
  ON user_policy_acknowledgments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own acknowledgments"
  ON user_policy_acknowledgments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all acknowledgments"
  ON user_policy_acknowledgments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.admin_id = auth.uid()
  ));

-- RLS Policies for policy_update_notifications
CREATE POLICY "Users can view their own policy notifications"
  ON policy_update_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own policy notifications"
  ON policy_update_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all policy notifications"
  ON policy_update_notifications FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.admin_id = auth.uid()
  ));

-- RLS Policies for policy_acknowledgment_stats
CREATE POLICY "Admins can view acknowledgment stats"
  ON policy_acknowledgment_stats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.admin_id = auth.uid()
  ));

CREATE POLICY "Admins can manage acknowledgment stats"
  ON policy_acknowledgment_stats FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.admin_id = auth.uid()
  ));

-- Function to get current policy version
CREATE OR REPLACE FUNCTION get_current_policy_version(p_policy_type TEXT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT version 
    FROM policy_texts 
    WHERE policy_type = p_policy_type 
      AND is_active = true 
    ORDER BY version DESC 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user needs to acknowledge policy
CREATE OR REPLACE FUNCTION user_needs_policy_acknowledgment(p_user_id UUID, p_policy_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_version NUMERIC;
  user_version NUMERIC;
BEGIN
  current_version := get_current_policy_version(p_policy_type);
  
  SELECT acknowledged_version INTO user_version
  FROM user_policy_acknowledgments
  WHERE user_id = p_user_id AND policy_type = p_policy_type;
  
  RETURN (user_version IS NULL OR user_version < current_version);
END;
$$ LANGUAGE plpgsql;

-- Function to create policy update notifications for all users
CREATE OR REPLACE FUNCTION notify_policy_update(
  p_policy_type TEXT,
  p_new_version NUMERIC
)
RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER := 0;
  user_record RECORD;
  policy_title TEXT;
BEGIN
  -- Get policy title
  SELECT title INTO policy_title
  FROM policy_texts
  WHERE policy_type = p_policy_type AND version = p_new_version;
  
  -- Find all users who need to acknowledge
  FOR user_record IN
    SELECT DISTINCT u.id, COALESCE(upa.acknowledged_version, 0) as old_version
    FROM auth.users u
    LEFT JOIN user_policy_acknowledgments upa 
      ON u.id = upa.user_id AND upa.policy_type = p_policy_type
    WHERE COALESCE(upa.acknowledged_version, 0) < p_new_version
  LOOP
    INSERT INTO policy_update_notifications (
      user_id,
      policy_type,
      old_version,
      new_version,
      title,
      message,
      link
    ) VALUES (
      user_record.id,
      p_policy_type,
      user_record.old_version,
      p_new_version,
      'We''ve updated our ' || policy_title,
      'Please review and accept the new version (v' || p_new_version || ') to continue using Overboard Market.',
      '/legal/policy-center?tab=' || p_policy_type
    )
    ON CONFLICT (user_id, policy_type) DO NOTHING;
    
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when acknowledgments change
CREATE OR REPLACE FUNCTION update_acknowledgment_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO policy_acknowledgment_stats (policy_type, version, acknowledged_count, pending_count)
    SELECT 
      NEW.policy_type,
      pt.version,
      COUNT(*) FILTER (WHERE upa.acknowledged_version >= pt.version),
      COUNT(*) FILTER (WHERE upa.acknowledged_version IS NULL OR upa.acknowledged_version < pt.version)
    FROM policy_texts pt
    CROSS JOIN auth.users u
    LEFT JOIN user_policy_acknowledgments upa 
      ON u.id = upa.user_id AND upa.policy_type = pt.policy_type
    WHERE pt.policy_type = NEW.policy_type 
      AND pt.is_active = true
    GROUP BY NEW.policy_type, pt.version
    ON CONFLICT (policy_type, version) 
    DO UPDATE SET
      acknowledged_count = EXCLUDED.acknowledged_count,
      pending_count = EXCLUDED.pending_count,
      last_updated = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_acknowledgment_stats
AFTER INSERT OR UPDATE ON user_policy_acknowledgments
FOR EACH ROW EXECUTE FUNCTION update_acknowledgment_stats();

-- Insert default policy versions (if they don't exist)
INSERT INTO policy_texts (policy_type, version, title, content, requires_acknowledgment, is_active)
VALUES 
  ('privacy', 1.0, 'Privacy Policy', '{"sections": []}', true, true),
  ('terms', 1.0, 'Terms of Use', '{"sections": []}', true, true),
  ('codeOfConduct', 1.0, 'Community Code of Conduct', '{"sections": []}', true, true)
ON CONFLICT (policy_type, version) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON policy_texts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_policy_acknowledgments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON policy_update_notifications TO authenticated;
GRANT SELECT ON policy_acknowledgment_stats TO authenticated;

GRANT EXECUTE ON FUNCTION get_current_policy_version(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_needs_policy_acknowledgment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_policy_update(TEXT, NUMERIC) TO authenticated;
