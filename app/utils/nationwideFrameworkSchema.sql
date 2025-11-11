-- Overboard Market - Nationwide Event & Vendor Framework
-- This schema supports nationwide vendor fairs with local filtering capabilities

-- =============================================
-- 1. STATES TABLE (Helper for filtering)
-- =============================================
CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code TEXT NOT NULL UNIQUE, -- "WI", "MN", "FL", etc.
  state_name TEXT NOT NULL, -- "Wisconsin"
  region TEXT, -- "Midwest", "South", "Northeast", etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert all US states
INSERT INTO states (state_code, state_name, region) VALUES
  ('AL', 'Alabama', 'South'),
  ('AK', 'Alaska', 'West'),
  ('AZ', 'Arizona', 'West'),
  ('AR', 'Arkansas', 'South'),
  ('CA', 'California', 'West'),
  ('CO', 'Colorado', 'West'),
  ('CT', 'Connecticut', 'Northeast'),
  ('DE', 'Delaware', 'South'),
  ('FL', 'Florida', 'South'),
  ('GA', 'Georgia', 'South'),
  ('HI', 'Hawaii', 'West'),
  ('ID', 'Idaho', 'West'),
  ('IL', 'Illinois', 'Midwest'),
  ('IN', 'Indiana', 'Midwest'),
  ('IA', 'Iowa', 'Midwest'),
  ('KS', 'Kansas', 'Midwest'),
  ('KY', 'Kentucky', 'South'),
  ('LA', 'Louisiana', 'South'),
  ('ME', 'Maine', 'Northeast'),
  ('MD', 'Maryland', 'South'),
  ('MA', 'Massachusetts', 'Northeast'),
  ('MI', 'Michigan', 'Midwest'),
  ('MN', 'Minnesota', 'Midwest'),
  ('MS', 'Mississippi', 'South'),
  ('MO', 'Missouri', 'Midwest'),
  ('MT', 'Montana', 'West'),
  ('NE', 'Nebraska', 'Midwest'),
  ('NV', 'Nevada', 'West'),
  ('NH', 'New Hampshire', 'Northeast'),
  ('NJ', 'New Jersey', 'Northeast'),
  ('NM', 'New Mexico', 'West'),
  ('NY', 'New York', 'Northeast'),
  ('NC', 'North Carolina', 'South'),
  ('ND', 'North Dakota', 'Midwest'),
  ('OH', 'Ohio', 'Midwest'),
  ('OK', 'Oklahoma', 'South'),
  ('OR', 'Oregon', 'West'),
  ('PA', 'Pennsylvania', 'Northeast'),
  ('RI', 'Rhode Island', 'Northeast'),
  ('SC', 'South Carolina', 'South'),
  ('SD', 'South Dakota', 'Midwest'),
  ('TN', 'Tennessee', 'South'),
  ('TX', 'Texas', 'South'),
  ('UT', 'Utah', 'West'),
  ('VT', 'Vermont', 'Northeast'),
  ('VA', 'Virginia', 'South'),
  ('WA', 'Washington', 'West'),
  ('WV', 'West Virginia', 'South'),
  ('WI', 'Wisconsin', 'Midwest'),
  ('WY', 'Wyoming', 'West')
ON CONFLICT (state_code) DO NOTHING;

-- =============================================
-- 2. UPDATE VENDORS TABLE
-- Add state and region fields to existing vendors table
-- =============================================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive'; -- 'active', 'inactive'
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS subscription_type TEXT; -- 'monthly', 'event_pass', null
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS joined_date DATE DEFAULT CURRENT_DATE;

-- Add foreign key constraint for state
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendors_state_fkey'
  ) THEN
    ALTER TABLE vendors 
    ADD CONSTRAINT vendors_state_fkey 
    FOREIGN KEY (state) REFERENCES states(state_code);
  END IF;
END $$;

-- Create index for faster state filtering
CREATE INDEX IF NOT EXISTS idx_vendors_state ON vendors(state);
CREATE INDEX IF NOT EXISTS idx_vendors_subscription_status ON vendors(subscription_status);

-- =============================================
-- 3. EVENTS TABLE (Enhanced)
-- Store event metadata for national, regional, or state markets
-- =============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  slug TEXT UNIQUE, -- URL-friendly identifier
  event_type TEXT NOT NULL, -- 'Seasonal', 'State', 'Regional', 'National', 'Themed'
  location_scope TEXT NOT NULL, -- 'Nationwide', 'Wisconsin', 'Midwest', etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TEXT, -- e.g., "10:00 AM"
  end_time TEXT, -- e.g., "6:00 PM"
  is_live BOOLEAN DEFAULT false,
  hero_image_url TEXT,
  description TEXT,
  featured_state_codes TEXT[], -- Array of state codes for multi-state markets
  featured BOOLEAN DEFAULT false,
  allow_chat BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create slug from event_name if not provided
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := lower(regexp_replace(NEW.event_name, '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_event_slug
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION generate_event_slug();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_is_live ON events(is_live);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- =============================================
-- 4. VENDOR_EVENT_LINKS TABLE
-- Join table connecting vendors ↔ events
-- =============================================
CREATE TABLE IF NOT EXISTS vendor_event_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  date_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, event_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_event_links_vendor ON vendor_event_links(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_event_links_event ON vendor_event_links(event_id);
CREATE INDEX IF NOT EXISTS idx_vendor_event_links_active ON vendor_event_links(is_active);

-- =============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_event_links ENABLE ROW LEVEL SECURITY;

-- States table policies (public read)
CREATE POLICY "Anyone can view active states"
  ON states FOR SELECT
  USING (is_active = true);

-- Events table policies
CREATE POLICY "Anyone can view live events"
  ON events FOR SELECT
  USING (is_live = true);

CREATE POLICY "Admins can manage all events"
  ON events FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Vendor event links policies
CREATE POLICY "Anyone can view active vendor event links"
  ON vendor_event_links FOR SELECT
  USING (is_active = true);

CREATE POLICY "Vendors can view their own event links"
  ON vendor_event_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors 
    WHERE vendors.id = vendor_event_links.vendor_id 
    AND vendors.auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage vendor event links"
  ON vendor_event_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Function to automatically add active vendors to new live events
CREATE OR REPLACE FUNCTION auto_add_active_vendors_to_event()
RETURNS TRIGGER AS $$
BEGIN
  -- When an event becomes live, add all active vendors with monthly subscription
  IF NEW.is_live = true AND (OLD.is_live IS NULL OR OLD.is_live = false) THEN
    INSERT INTO vendor_event_links (vendor_id, event_id, is_active)
    SELECT v.id, NEW.id, true
    FROM vendors v
    WHERE v.subscription_status = 'active' 
      AND v.subscription_type = 'monthly'
    ON CONFLICT (vendor_id, event_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-add vendors when event goes live
DROP TRIGGER IF EXISTS trigger_auto_add_vendors_to_event ON events;
CREATE TRIGGER trigger_auto_add_vendors_to_event
  AFTER INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_active_vendors_to_event();

-- Function to get vendor count for an event
CREATE OR REPLACE FUNCTION get_event_vendor_count(event_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  vendor_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT vel.vendor_id)
  INTO vendor_count
  FROM vendor_event_links vel
  WHERE vel.event_id = event_uuid
    AND vel.is_active = true;
  RETURN vendor_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. VIEWS FOR EASIER QUERYING
-- =============================================

-- View: Events with vendor counts
CREATE OR REPLACE VIEW events_with_vendor_counts AS
SELECT 
  e.*,
  COUNT(DISTINCT vel.vendor_id) as vendor_count
FROM events e
LEFT JOIN vendor_event_links vel ON e.id = vel.event_id AND vel.is_active = true
GROUP BY e.id;

-- View: Vendors with their events
CREATE OR REPLACE VIEW vendors_with_events AS
SELECT 
  v.*,
  COALESCE(
    json_agg(
      json_build_object(
        'event_id', e.id,
        'event_name', e.event_name,
        'slug', e.slug,
        'event_type', e.event_type,
        'start_date', e.start_date,
        'end_date', e.end_date,
        'is_live', e.is_live
      )
    ) FILTER (WHERE e.id IS NOT NULL),
    '[]'
  ) as events
FROM vendors v
LEFT JOIN vendor_event_links vel ON v.id = vel.vendor_id AND vel.is_active = true
LEFT JOIN events e ON vel.event_id = e.id
GROUP BY v.id;

-- =============================================
-- 8. UPDATED_AT TRIGGERS
-- =============================================

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- NOTES FOR RORK IMPLEMENTATION
-- =============================================
-- 
-- To use this schema in your app:
-- 
-- 1. Run this SQL in your Supabase SQL Editor
-- 
-- 2. Update your TypeScript types to match these tables
-- 
-- 3. Query patterns:
--    - Get vendors by state: SELECT * FROM vendors WHERE state = 'WI'
--    - Get live events: SELECT * FROM events_with_vendor_counts WHERE is_live = true
--    - Get vendors for an event: 
--      SELECT v.* FROM vendors v
--      JOIN vendor_event_links vel ON v.id = vel.vendor_id
--      WHERE vel.event_id = $1 AND vel.is_active = true
-- 
-- 4. Shopper "Shop Local" flow:
--    - Show state dropdown/map
--    - Filter: WHERE state = selected_state AND subscription_status = 'active'
--    - Show both marketplace vendors + live events in that state
-- 
-- 5. Vendor subscription logic:
--    - $15/month → subscription_type = 'monthly', auto-added to all live events
--    - $20 one-time → subscription_type = 'event_pass', manually added to specific event
-- 
-- =============================================
