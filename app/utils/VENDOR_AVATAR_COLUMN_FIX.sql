-- =============================================
-- Fix: Ensure avatar column exists in vendors table
-- =============================================
-- This fixes the error: "column v.avatar does not exist"

-- Add avatar column if it doesn't exist
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Verify the function can now access the avatar column
-- Re-create the get_live_vendors function to ensure it works
CREATE OR REPLACE FUNCTION get_live_vendors()
RETURNS TABLE (
  id uuid,
  vendor_name text,
  state text,
  logo_url text,
  live_platform text,
  live_url text,
  live_started_at timestamptz,
  session_notes text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.business_name,
    v.state,
    v.avatar AS logo_url,
    v.live_platform,
    v.live_url,
    v.live_started_at,
    ls.notes
  FROM vendors v
  LEFT JOIN vendor_live_sessions ls 
    ON ls.vendor_id = v.id 
    AND ls.ended_at IS NULL
  WHERE v.is_live = true
  ORDER BY v.live_started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify vendor live columns exist
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS live_platform text CHECK (live_platform IN ('youtube', 'instagram', 'facebook', 'tiktok', 'other')),
ADD COLUMN IF NOT EXISTS live_url text,
ADD COLUMN IF NOT EXISTS live_started_at timestamptz,
ADD COLUMN IF NOT EXISTS state text;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_vendors_is_live ON vendors(is_live) WHERE is_live = true;
