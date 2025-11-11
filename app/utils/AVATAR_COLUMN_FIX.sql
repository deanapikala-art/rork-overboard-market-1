-- =============================================
-- FINAL FIX for vendor_live "avatar" column error
-- =============================================
-- The get_live_vendors() function is referencing v.avatar
-- which doesn't exist. The vendors table uses logo_url.
-- This fix updates the function to use the correct column.

-- Drop and recreate the function with the correct column
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
    v.business_name,
    v.state,
    v.logo_url,  -- This is the correct column name
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_live_vendors() TO authenticated;
GRANT EXECUTE ON FUNCTION get_live_vendors() TO anon;
