-- ============================================
-- Fix Policy Texts Version Column
-- ============================================
-- This ensures the version column exists and has proper type

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS policy_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type TEXT NOT NULL CHECK (policy_type IN ('terms', 'privacy', 'codeOfConduct')),
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  requires_acknowledgment BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(policy_type, version)
);

-- Add version column if it doesn't exist (using INTEGER for simplicity)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'policy_texts' AND column_name = 'version'
  ) THEN
    ALTER TABLE policy_texts ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_policy_texts_type_version ON policy_texts(policy_type, version DESC);
CREATE INDEX IF NOT EXISTS idx_policy_texts_active ON policy_texts(policy_type, is_active);

-- Insert default policy versions (if they don't exist)
INSERT INTO policy_texts (policy_type, version, title, content, requires_acknowledgment, is_active)
VALUES 
  ('privacy', 1, 'Privacy Policy', '{"sections": [{"title": "Introduction", "content": "Your privacy is important to us."}]}', true, true),
  ('terms', 1, 'Terms of Use', '{"sections": [{"title": "Agreement", "content": "By using our service, you agree to these terms."}]}', true, true),
  ('codeOfConduct', 1, 'Community Code of Conduct', '{"sections": [{"title": "Be Respectful", "content": "Treat all community members with respect."}]}', true, true)
ON CONFLICT (policy_type, version) DO NOTHING;

-- Enable RLS if not already enabled
ALTER TABLE policy_texts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read active policy texts" ON policy_texts;
DROP POLICY IF EXISTS "Admins can manage policy texts" ON policy_texts;

-- RLS Policies for policy_texts (everyone can read active policies)
CREATE POLICY "Anyone can read active policy texts"
  ON policy_texts FOR SELECT
  USING (is_active = true);

-- Allow admins to manage (update this based on your admin setup)
CREATE POLICY "Admins can manage policy texts"
  ON policy_texts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.admin_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON policy_texts TO authenticated;
GRANT SELECT ON policy_texts TO anon;
