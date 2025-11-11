-- Service Vendors Schema Extension
-- This extends the existing vendors table and adds service-specific tables

-- Update vendors table with service vendor fields
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_type TEXT DEFAULT 'product' CHECK (vendor_type IN ('product', 'service', 'both'));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS service_area_type TEXT CHECK (service_area_type IN ('local', 'virtual', 'both'));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS service_area_zip_codes TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS service_categories TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS booking_link TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pricing_model TEXT CHECK (pricing_model IN ('flat_rate', 'hourly', 'retainer', 'quote'));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS starting_price DECIMAL(10, 2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS availability_notes TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS portfolio_images TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS testimonials JSONB[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verified_status TEXT DEFAULT 'unverified' CHECK (verified_status IN ('unverified', 'submitted', 'verified'));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tos_accepted BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS short_bio TEXT;

-- Service Packages Table
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  package_desc TEXT NOT NULL,
  package_price DECIMAL(10, 2),
  package_duration TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update live_vendor_fair_vendors if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'live_vendor_fair_vendors') THEN
    ALTER TABLE live_vendor_fair_vendors ADD COLUMN IF NOT EXISTS booth_type TEXT DEFAULT 'product' CHECK (booth_type IN ('product', 'service', 'both'));
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Policies for service_packages table
CREATE POLICY "Public can view active service packages"
  ON service_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Vendors can manage their own service packages"
  ON service_packages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = service_packages.vendor_id AND vendors.auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all service packages"
  ON service_packages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can delete service packages"
  ON service_packages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Trigger for updated_at on service_packages
CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON service_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_type ON vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_service_categories ON vendors USING GIN(service_categories);
CREATE INDEX IF NOT EXISTS idx_vendors_service_area_zip_codes ON vendors USING GIN(service_area_zip_codes);
CREATE INDEX IF NOT EXISTS idx_service_packages_vendor_id ON service_packages(vendor_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_is_active ON service_packages(is_active);
