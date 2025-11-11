-- =============================================
-- Final Fix for Vendor Avatar Column Issue
-- =============================================
-- This adds the missing avatar column to vendors table
-- and updates the get_live_vendors function

-- Step 1: Add avatar column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'avatar'
  ) THEN
    ALTER TABLE vendors ADD COLUMN avatar TEXT;
    RAISE NOTICE 'Added avatar column to vendors table';
  ELSE
    RAISE NOTICE 'Avatar column already exists';
  END IF;
END $$;

-- Step 2: Recreate the get_live_vendors function to use the correct column
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

-- Verify the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'avatar'
  ) THEN
    RAISE NOTICE 'SUCCESS: Avatar column exists in vendors table';
  ELSE
    RAISE EXCEPTION 'FAILED: Avatar column still missing from vendors table';
  END IF;
END $$;
