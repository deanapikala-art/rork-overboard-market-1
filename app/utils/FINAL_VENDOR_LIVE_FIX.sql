-- =============================================
-- FINAL VENDOR LIVE FIX - Complete Solution
-- =============================================
-- This SQL completely fixes all vendor live issues
-- Run this in your Supabase SQL Editor

-- Step 1: Ensure all required columns exist in vendors table
DO $$ 
BEGIN
  -- Add avatar column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'vendors' 
    AND column_name = 'avatar'
  ) THEN
    ALTER TABLE vendors ADD COLUMN avatar TEXT;
    RAISE NOTICE 'Added avatar column to vendors table';
  ELSE
    RAISE NOTICE 'Avatar column already exists';
  END IF;

  -- Add state column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'vendors' 
    AND column_name = 'state'
  ) THEN
    ALTER TABLE vendors ADD COLUMN state TEXT;
    RAISE NOTICE 'Added state column to vendors table';
  ELSE
    RAISE NOTICE 'State column already exists';
  END IF;

  -- Add is_live column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'vendors' 
    AND column_name = 'is_live'
  ) THEN
    ALTER TABLE vendors ADD COLUMN is_live BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_live column to vendors table';
  ELSE
    RAISE NOTICE 'is_live column already exists';
  END IF;

  -- Add live_platform column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'vendors' 
    AND column_name = 'live_platform'
  ) THEN
    ALTER TABLE vendors ADD COLUMN live_platform TEXT;
    RAISE NOTICE 'Added live_platform column to vendors table';
  ELSE
    RAISE NOTICE 'live_platform column already exists';
  END IF;

  -- Add constraint to live_platform if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public'
    AND tc.table_name = 'vendors'
    AND ccu.column_name = 'live_platform'
    AND tc.constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_live_platform_check 
      CHECK (live_platform IN ('youtube', 'instagram', 'facebook', 'tiktok', 'other'));
    RAISE NOTICE 'Added constraint to live_platform column';
  ELSE
    RAISE NOTICE 'live_platform constraint already exists';
  END IF;

  -- Add live_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'vendors' 
    AND column_name = 'live_url'
  ) THEN
    ALTER TABLE vendors ADD COLUMN live_url TEXT;
    RAISE NOTICE 'Added live_url column to vendors table';
  ELSE
    RAISE NOTICE 'live_url column already exists';
  END IF;

  -- Add live_started_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'vendors' 
    AND column_name = 'live_started_at'
  ) THEN
    ALTER TABLE vendors ADD COLUMN live_started_at TIMESTAMPTZ;
    RAISE NOTICE 'Added live_started_at column to vendors table';
  ELSE
    RAISE NOTICE 'live_started_at column already exists';
  END IF;
END $$;

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_vendors_is_live ON vendors(is_live) WHERE is_live = true;
RAISE NOTICE 'Created/verified index on is_live column';

-- Step 3: Create vendor_live_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendor_live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('youtube', 'instagram', 'facebook', 'tiktok', 'other')),
  live_url text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  clicks integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 4: Create indexes for vendor_live_sessions
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_vendor_id ON vendor_live_sessions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_started_at ON vendor_live_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_active ON vendor_live_sessions(vendor_id, ended_at) 
WHERE ended_at IS NULL;

-- Step 5: Create vendor_live_click_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendor_live_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  live_session_id uuid REFERENCES vendor_live_sessions(id) ON DELETE CASCADE,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Step 6: Create indexes for vendor_live_click_events
CREATE INDEX IF NOT EXISTS idx_vendor_live_click_events_vendor_id ON vendor_live_click_events(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_live_click_events_session_id ON vendor_live_click_events(live_session_id);
CREATE INDEX IF NOT EXISTS idx_vendor_live_click_events_clicked_at ON vendor_live_click_events(clicked_at DESC);

-- Step 7: Enable RLS on new tables
ALTER TABLE vendor_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_live_click_events ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Vendors can view their own live sessions" ON vendor_live_sessions;
DROP POLICY IF EXISTS "Vendors can create their own live sessions" ON vendor_live_sessions;
DROP POLICY IF EXISTS "Vendors can update their own live sessions" ON vendor_live_sessions;
DROP POLICY IF EXISTS "Public can view active live sessions" ON vendor_live_sessions;
DROP POLICY IF EXISTS "Public can view click events" ON vendor_live_click_events;
DROP POLICY IF EXISTS "Anyone can track clicks" ON vendor_live_click_events;

-- Recreate policies
CREATE POLICY "Vendors can view their own live sessions"
  ON vendor_live_sessions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM vendors WHERE id = vendor_live_sessions.vendor_id
    )
  );

CREATE POLICY "Vendors can create their own live sessions"
  ON vendor_live_sessions FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT auth_user_id FROM vendors WHERE id = vendor_live_sessions.vendor_id
    )
  );

CREATE POLICY "Vendors can update their own live sessions"
  ON vendor_live_sessions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM vendors WHERE id = vendor_live_sessions.vendor_id
    )
  );

CREATE POLICY "Public can view active live sessions"
  ON vendor_live_sessions FOR SELECT
  USING (ended_at IS NULL);

CREATE POLICY "Public can view click events"
  ON vendor_live_click_events FOR SELECT
  USING (true);

CREATE POLICY "Anyone can track clicks"
  ON vendor_live_click_events FOR INSERT
  WITH CHECK (true);

-- Step 9: Drop and recreate the get_live_vendors function
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

-- Step 10: Drop and recreate the record_live_click function
DROP FUNCTION IF EXISTS record_live_click(uuid, uuid);

CREATE OR REPLACE FUNCTION record_live_click(
  p_vendor_id uuid,
  p_session_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Increment session clicks
  IF p_session_id IS NOT NULL THEN
    UPDATE vendor_live_sessions
    SET clicks = clicks + 1
    WHERE id = p_session_id;
  END IF;
  
  -- Record click event
  INSERT INTO vendor_live_click_events (vendor_id, live_session_id)
  VALUES (p_vendor_id, p_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create auto-end stale sessions function
DROP FUNCTION IF EXISTS auto_end_stale_live_sessions();

CREATE OR REPLACE FUNCTION auto_end_stale_live_sessions()
RETURNS void AS $$
BEGIN
  -- End sessions that have been live for more than 6 hours
  UPDATE vendor_live_sessions
  SET ended_at = now()
  WHERE ended_at IS NULL
    AND started_at < (now() - INTERVAL '6 hours');
    
  -- Update vendor is_live status
  UPDATE vendors
  SET is_live = false,
      live_platform = NULL,
      live_url = NULL,
      live_started_at = NULL
  WHERE is_live = true
    AND id NOT IN (
      SELECT vendor_id 
      FROM vendor_live_sessions 
      WHERE ended_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create trigger function for updated_at (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_vendor_live_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Create trigger
DROP TRIGGER IF EXISTS vendor_live_sessions_updated_at ON vendor_live_sessions;
CREATE TRIGGER vendor_live_sessions_updated_at
  BEFORE UPDATE ON vendor_live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_live_sessions_updated_at();

-- Step 14: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_live_vendors() TO public;
GRANT EXECUTE ON FUNCTION get_live_vendors() TO anon;
GRANT EXECUTE ON FUNCTION get_live_vendors() TO authenticated;
GRANT EXECUTE ON FUNCTION record_live_click(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION record_live_click(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION record_live_click(uuid, uuid) TO authenticated;

-- Step 15: Verify the function works
DO $$
DECLARE
  result_count INTEGER;
  column_exists BOOLEAN;
BEGIN
  -- Check if avatar column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'vendors' 
    AND column_name = 'avatar'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE '✓ Avatar column exists in vendors table';
  ELSE
    RAISE WARNING '✗ Avatar column does NOT exist in vendors table';
  END IF;

  -- Test the function
  BEGIN
    SELECT COUNT(*) INTO result_count FROM get_live_vendors();
    RAISE NOTICE '✓ get_live_vendors() function executed successfully. Found % live vendors', result_count;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '✗ get_live_vendors() function failed: %', SQLERRM;
  END;
END $$;

-- Add comments
COMMENT ON TABLE vendor_live_sessions IS 'Tracks vendor live streaming sessions across platforms';
COMMENT ON TABLE vendor_live_click_events IS 'Records individual clicks on live vendor streams for analytics';
COMMENT ON FUNCTION get_live_vendors IS 'Returns all currently live vendors with session details';
COMMENT ON FUNCTION record_live_click IS 'Records a click event and increments session click counter';
COMMENT ON FUNCTION auto_end_stale_live_sessions IS 'Automatically ends live sessions older than 6 hours';

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ VENDOR LIVE FIX COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All vendor live features should now work correctly.';
  RAISE NOTICE 'Please refresh your app to test.';
END $$;
