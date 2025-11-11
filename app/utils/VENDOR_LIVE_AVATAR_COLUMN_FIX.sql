-- =============================================
-- VENDOR LIVE AVATAR COLUMN FIX
-- =============================================
-- This SQL fixes the "column v.avatar does not exist" error
-- Run this in your Supabase SQL Editor

-- Step 1: Ensure the avatar column exists in vendors table
-- (It should already exist, but this is a safety check)
DO $$ 
BEGIN
  -- Add avatar column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'avatar'
  ) THEN
    ALTER TABLE vendors ADD COLUMN avatar TEXT;
    RAISE NOTICE 'Added avatar column to vendors table';
  ELSE
    RAISE NOTICE 'Avatar column already exists in vendors table';
  END IF;
END $$;

-- Step 2: Ensure the state column exists in vendors table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'state'
  ) THEN
    ALTER TABLE vendors ADD COLUMN state TEXT;
    RAISE NOTICE 'Added state column to vendors table';
  ELSE
    RAISE NOTICE 'State column already exists in vendors table';
  END IF;
END $$;

-- Step 3: Verify live columns exist
DO $$ 
BEGIN
  -- Add is_live column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'is_live'
  ) THEN
    ALTER TABLE vendors ADD COLUMN is_live BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_live column to vendors table';
  END IF;

  -- Add live_platform column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'live_platform'
  ) THEN
    ALTER TABLE vendors ADD COLUMN live_platform TEXT CHECK (live_platform IN ('youtube', 'instagram', 'facebook', 'tiktok', 'other'));
    RAISE NOTICE 'Added live_platform column to vendors table';
  END IF;

  -- Add live_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'live_url'
  ) THEN
    ALTER TABLE vendors ADD COLUMN live_url TEXT;
    RAISE NOTICE 'Added live_url column to vendors table';
  END IF;

  -- Add live_started_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'live_started_at'
  ) THEN
    ALTER TABLE vendors ADD COLUMN live_started_at TIMESTAMPTZ;
    RAISE NOTICE 'Added live_started_at column to vendors table';
  END IF;
END $$;

-- Step 4: Create index for quick live vendor queries
CREATE INDEX IF NOT EXISTS idx_vendors_is_live ON vendors(is_live) WHERE is_live = true;

-- Step 5: Drop and recreate the get_live_vendors function
DROP FUNCTION IF EXISTS get_live_vendors();

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
    v.business_name::text AS vendor_name,
    v.state::text,
    v.avatar::text AS logo_url,
    v.live_platform::text,
    v.live_url::text,
    v.live_started_at,
    COALESCE(ls.notes::text, NULL) AS session_notes
  FROM vendors v
  LEFT JOIN vendor_live_sessions ls 
    ON ls.vendor_id = v.id 
    AND ls.ended_at IS NULL
  WHERE v.is_live = true
  ORDER BY v.live_started_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_live_vendors() TO public;
GRANT EXECUTE ON FUNCTION get_live_vendors() TO anon;
GRANT EXECUTE ON FUNCTION get_live_vendors() TO authenticated;

-- Step 7: Verify the function works
DO $$
DECLARE
  result_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO result_count FROM get_live_vendors();
  RAISE NOTICE 'get_live_vendors() function executed successfully. Found % live vendors', result_count;
END $$;

COMMENT ON FUNCTION get_live_vendors IS 'Returns all currently live vendors with session details - FIXED: Ensures avatar column exists';
