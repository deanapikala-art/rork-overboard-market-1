-- =============================================
-- Fix for logo_url column error in get_live_vendors
-- =============================================
-- The get_live_vendors function was selecting v.avatar
-- but the return type expected logo_url as the column name.
-- This fix updates the function to use the correct alias.

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
    v.avatar as logo_url,
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

COMMENT ON FUNCTION get_live_vendors IS 'Returns all currently live vendors with session details (fixed avatar->logo_url mapping)';
