-- Pickup Safety Tips Tracking Schema
-- Add fields to track whether users have seen the safety tips modal

-- Add pickup_safety_seen column to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS pickup_safety_seen BOOLEAN DEFAULT FALSE;

-- Add pickup_safety_last_shown column to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS pickup_safety_last_shown TIMESTAMP;

-- Add pickup_safety_seen column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS pickup_safety_seen BOOLEAN DEFAULT FALSE;

-- Add pickup_safety_last_shown column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS pickup_safety_last_shown TIMESTAMP;

-- Create optional safety_tips table for admin-managed content
CREATE TABLE IF NOT EXISTS safety_tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version INTEGER NOT NULL DEFAULT 1,
  audience TEXT NOT NULL CHECK (audience IN ('vendor', 'customer')),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_safety_tips_audience ON safety_tips(audience);

-- Insert default safety tip content
INSERT INTO safety_tips (version, audience, content)
VALUES 
  (1, 'vendor', 'Follow best practices for safe local pickup exchanges'),
  (1, 'customer', 'Stay safe when meeting sellers for local pickup')
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE safety_tips ENABLE ROW LEVEL SECURITY;

-- Everyone can read safety tips
CREATE POLICY "Anyone can read safety tips" ON safety_tips
  FOR SELECT USING (true);

-- Only admins can insert/update safety tips (implement admin check based on your system)
CREATE POLICY "Admins can manage safety tips" ON safety_tips
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

COMMENT ON COLUMN vendors.pickup_safety_seen IS 'Tracks whether vendor has seen the pickup safety tips modal';
COMMENT ON COLUMN vendors.pickup_safety_last_shown IS 'Last time the safety tips modal was shown to vendor';
COMMENT ON COLUMN customers.pickup_safety_seen IS 'Tracks whether customer has seen the pickup safety tips modal';
COMMENT ON COLUMN customers.pickup_safety_last_shown IS 'Last time the safety tips modal was shown to customer';
COMMENT ON TABLE safety_tips IS 'Admin-managed safety tips content that can be updated without code changes';
