-- =============================================
-- Complete Fix for Vendor Live Feature
-- =============================================
-- This fixes all column mismatches in get_live_vendors function
-- The vendors table has: avatar, business_name, location (not state)

-- First, add the state column to vendors table if it doesn't exist
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS state TEXT;

-- Create a function to extract state from location if needed
-- This is useful if locations are formatted like "City, State" or "City, ST"
CREATE OR REPLACE FUNCTION extract_state_from_location(location_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Extract state abbreviation from "City, ST" format
  -- If location is "Portland, OR", this returns "OR"
  IF location_text IS NOT NULL AND position(',' IN location_text) > 0 THEN
    RETURN TRIM(SUBSTRING(location_text FROM position(',' IN location_text) + 1));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Optionally populate state column from location for existing records
-- Uncomment the next line if you want to auto-populate state from location
-- UPDATE vendors SET state = extract_state_from_location(location) WHERE state IS NULL;

-- Now recreate the get_live_vendors function with correct column references
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

-- Grant execute permission to public (for shoppers to view live vendors)
GRANT EXECUTE ON FUNCTION get_live_vendors TO public;
GRANT EXECUTE ON FUNCTION get_live_vendors TO anon;
GRANT EXECUTE ON FUNCTION get_live_vendors TO authenticated;

COMMENT ON FUNCTION get_live_vendors IS 'Returns all currently live vendors with session details - FIXED column references';
