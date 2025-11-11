-- Delivery Tracking Schema Extension
-- Adds automatic delivery confirmation and tracking integration

-- Add shipping and tracking columns to user_orders table
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending';
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS shipping_provider TEXT;
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS delivery_confirmed_by TEXT;
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS auto_status_updates_enabled BOOLEAN DEFAULT false;
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS tracking_provider_api TEXT;
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE user_orders ADD COLUMN IF NOT EXISTS is_local_pickup BOOLEAN DEFAULT false;

-- Create index for tracking lookups
CREATE INDEX IF NOT EXISTS idx_user_orders_tracking_number ON user_orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_user_orders_shipping_status ON user_orders(shipping_status);

-- Add comments for new columns
COMMENT ON COLUMN user_orders.shipping_status IS 'Shipping status: pending, shipped, in_transit, out_for_delivery, delivered, pickup_ready, picked_up';
COMMENT ON COLUMN user_orders.shipping_provider IS 'Carrier name: USPS, UPS, FedEx, DHL, etc.';
COMMENT ON COLUMN user_orders.tracking_number IS 'Carrier tracking number';
COMMENT ON COLUMN user_orders.tracking_url IS 'Full tracking URL for customer convenience';
COMMENT ON COLUMN user_orders.shipped_at IS 'Timestamp when vendor marked order as shipped';
COMMENT ON COLUMN user_orders.delivered_at IS 'Timestamp when delivery was confirmed (auto or manual)';
COMMENT ON COLUMN user_orders.delivery_confirmed_by IS 'Who confirmed delivery: System, Vendor, or Customer';
COMMENT ON COLUMN user_orders.auto_status_updates_enabled IS 'Whether to use automatic carrier tracking';
COMMENT ON COLUMN user_orders.tracking_provider_api IS 'API service used for tracking (EasyPost, 17Track, etc.)';
COMMENT ON COLUMN user_orders.estimated_delivery_date IS 'Expected delivery date from carrier';
COMMENT ON COLUMN user_orders.delivery_notes IS 'Additional delivery information or instructions';
COMMENT ON COLUMN user_orders.is_local_pickup IS 'Whether this is a local pickup order (no shipping)';

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

CREATE TRIGGER trigger_set_tracking_url
  BEFORE INSERT OR UPDATE ON user_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_url();

-- View for orders needing tracking updates
CREATE OR REPLACE VIEW orders_with_active_tracking AS
SELECT 
  id,
  order_number,
  customer_id,
  vendor_id,
  tracking_number,
  shipping_provider,
  tracking_url,
  shipping_status,
  shipped_at,
  auto_status_updates_enabled,
  tracking_provider_api
FROM user_orders
WHERE 
  auto_status_updates_enabled = true
  AND tracking_number IS NOT NULL
  AND shipping_status IN ('shipped', 'in_transit', 'out_for_delivery')
  AND delivered_at IS NULL;

-- Function to mark order as delivered
CREATE OR REPLACE FUNCTION mark_order_delivered(
  p_order_id UUID,
  p_confirmed_by TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_orders
  SET 
    shipping_status = 'delivered',
    delivered_at = NOW(),
    delivery_confirmed_by = p_confirmed_by,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Analytics view for shipping performance
CREATE OR REPLACE VIEW vendor_shipping_analytics AS
SELECT 
  vendor_id,
  vendor_name,
  COUNT(*) as total_orders_shipped,
  COUNT(CASE WHEN shipping_status = 'delivered' THEN 1 END) as delivered_orders,
  COUNT(CASE WHEN shipping_status IN ('shipped', 'in_transit', 'out_for_delivery') THEN 1 END) as in_transit_orders,
  AVG(
    CASE 
      WHEN delivered_at IS NOT NULL AND shipped_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (delivered_at - shipped_at)) / 86400
      ELSE NULL 
    END
  ) as avg_delivery_days,
  COUNT(CASE WHEN delivery_confirmed_by = 'System' THEN 1 END) as auto_confirmed_deliveries,
  COUNT(CASE WHEN delivery_confirmed_by = 'Vendor' THEN 1 END) as vendor_confirmed_deliveries,
  COUNT(CASE WHEN delivery_confirmed_by = 'Customer' THEN 1 END) as customer_confirmed_deliveries
FROM user_orders
WHERE shipped_at IS NOT NULL
GROUP BY vendor_id, vendor_name;

COMMENT ON VIEW orders_with_active_tracking IS 'Orders with active tracking that need status updates';
COMMENT ON VIEW vendor_shipping_analytics IS 'Shipping performance metrics per vendor';
