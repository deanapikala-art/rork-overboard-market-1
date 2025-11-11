-- Add delivery tracking columns to orders table
-- Run this if you're getting errors about missing columns

-- Add shipping and tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_provider TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmed_by TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS auto_status_updates_enabled BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_provider_api TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_local_pickup BOOLEAN DEFAULT false;

-- Create index for tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);

-- Add comments for new columns
COMMENT ON COLUMN orders.shipping_status IS 'Shipping status: pending, shipped, in_transit, out_for_delivery, delivered, pickup_ready, picked_up';
COMMENT ON COLUMN orders.shipping_provider IS 'Carrier name: USPS, UPS, FedEx, DHL, etc.';
COMMENT ON COLUMN orders.tracking_number IS 'Carrier tracking number';
COMMENT ON COLUMN orders.tracking_url IS 'Full tracking URL for customer convenience';
COMMENT ON COLUMN orders.shipped_at IS 'Timestamp when vendor marked order as shipped';
COMMENT ON COLUMN orders.delivered_at IS 'Timestamp when delivery was confirmed (auto or manual)';
COMMENT ON COLUMN orders.delivery_confirmed_by IS 'Who confirmed delivery: System, Vendor, or Customer';
COMMENT ON COLUMN orders.auto_status_updates_enabled IS 'Whether to use automatic carrier tracking';
COMMENT ON COLUMN orders.tracking_provider_api IS 'API service used for tracking (EasyPost, 17Track, etc.)';
COMMENT ON COLUMN orders.estimated_delivery_date IS 'Expected delivery date from carrier';
COMMENT ON COLUMN orders.delivery_notes IS 'Additional delivery information or instructions';
COMMENT ON COLUMN orders.is_local_pickup IS 'Whether this is a local pickup order (no shipping)';

-- Function to generate tracking URL based on provider
CREATE OR REPLACE FUNCTION generate_tracking_url(
  provider TEXT,
  tracking_num TEXT
)
RETURNS TEXT AS $$
BEGIN
  CASE LOWER(provider)
    WHEN 'usps' THEN
      RETURN 'https://tools.usps.com/go/TrackConfirmAction?tLabels=' || tracking_num;
    WHEN 'ups' THEN
      RETURN 'https://www.ups.com/track?tracknum=' || tracking_num;
    WHEN 'fedex' THEN
      RETURN 'https://www.fedex.com/fedextrack/?trknbr=' || tracking_num;
    WHEN 'dhl' THEN
      RETURN 'https://www.dhl.com/en/express/tracking.html?AWB=' || tracking_num;
    WHEN 'dhl express' THEN
      RETURN 'https://www.dhl.com/en/express/tracking.html?AWB=' || tracking_num;
    ELSE
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tracking URL when tracking info is added
CREATE OR REPLACE FUNCTION set_tracking_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NOT NULL AND NEW.shipping_provider IS NOT NULL THEN
    IF NEW.tracking_url IS NULL OR NEW.tracking_url = '' THEN
      NEW.tracking_url := generate_tracking_url(NEW.shipping_provider, NEW.tracking_number);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_tracking_url ON orders;
CREATE TRIGGER trigger_set_tracking_url
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_url();
