-- =============================================
-- Vendor Live Sessions Schema
-- =============================================
-- This schema enables the "Vendor is Live" feature
-- allowing vendors to broadcast on YouTube, Instagram,
-- Facebook, TikTok and shoppers to discover live vendors

-- Add fields to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS live_platform text CHECK (live_platform IN ('youtube', 'instagram', 'facebook', 'tiktok', 'other')),
ADD COLUMN IF NOT EXISTS live_url text,
ADD COLUMN IF NOT EXISTS live_started_at timestamptz,
ADD COLUMN IF NOT EXISTS state text;

-- Create index for quick live vendor queries
CREATE INDEX IF NOT EXISTS idx_vendors_is_live ON vendors(is_live) WHERE is_live = true;

-- =============================================
-- Vendor Live Sessions Table
-- =============================================
-- Tracks live session history and analytics
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_vendor_id ON vendor_live_sessions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_started_at ON vendor_live_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_active ON vendor_live_sessions(vendor_id, ended_at) 
WHERE ended_at IS NULL;

-- =============================================
-- Vendor Live Click Events Table (Optional)
-- =============================================
-- Tracks individual clicks for detailed analytics
CREATE TABLE IF NOT EXISTS vendor_live_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  live_session_id uuid REFERENCES vendor_live_sessions(id) ON DELETE CASCADE,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_vendor_live_click_events_vendor_id ON vendor_live_click_events(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_live_click_events_session_id ON vendor_live_click_events(live_session_id);
CREATE INDEX IF NOT EXISTS idx_vendor_live_click_events_clicked_at ON vendor_live_click_events(clicked_at DESC);

-- =============================================
-- Functions
-- =============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_live_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS vendor_live_sessions_updated_at ON vendor_live_sessions;
CREATE TRIGGER vendor_live_sessions_updated_at
  BEFORE UPDATE ON vendor_live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_live_sessions_updated_at();

-- =============================================
-- RLS Policies
-- =============================================

-- Enable RLS
ALTER TABLE vendor_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_live_click_events ENABLE ROW LEVEL SECURITY;

-- Vendors can read their own sessions
CREATE POLICY "Vendors can view their own live sessions"
  ON vendor_live_sessions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM vendors WHERE id = vendor_live_sessions.vendor_id
    )
  );

-- Vendors can insert their own sessions
CREATE POLICY "Vendors can create their own live sessions"
  ON vendor_live_sessions FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT auth_user_id FROM vendors WHERE id = vendor_live_sessions.vendor_id
    )
  );

-- Vendors can update their own sessions
CREATE POLICY "Vendors can update their own live sessions"
  ON vendor_live_sessions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM vendors WHERE id = vendor_live_sessions.vendor_id
    )
  );

-- Public can read live sessions (for shoppers to see who's live)
CREATE POLICY "Public can view active live sessions"
  ON vendor_live_sessions FOR SELECT
  USING (ended_at IS NULL);

-- Public can view click events (anonymized analytics)
CREATE POLICY "Public can view click events"
  ON vendor_live_click_events FOR SELECT
  USING (true);

-- Anyone can insert click events (tracking)
CREATE POLICY "Anyone can track clicks"
  ON vendor_live_click_events FOR INSERT
  WITH CHECK (true);

-- =============================================
-- Helper Functions for Queries
-- =============================================

-- Function to get currently live vendors with details
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

-- Function to record click event
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

-- =============================================
-- Automated Cleanup
-- =============================================

-- Function to auto-end stale live sessions (6 hour timeout)
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

-- Note: Set up a cron job or scheduled function to call this periodically
-- Example using pg_cron (if available):
-- SELECT cron.schedule('auto-end-stale-sessions', '*/15 * * * *', 'SELECT auto_end_stale_live_sessions()');

COMMENT ON TABLE vendor_live_sessions IS 'Tracks vendor live streaming sessions across platforms';
COMMENT ON TABLE vendor_live_click_events IS 'Records individual clicks on live vendor streams for analytics';
COMMENT ON FUNCTION get_live_vendors IS 'Returns all currently live vendors with session details';
COMMENT ON FUNCTION record_live_click IS 'Records a click event and increments session click counter';
COMMENT ON FUNCTION auto_end_stale_live_sessions IS 'Automatically ends live sessions older than 6 hours';
