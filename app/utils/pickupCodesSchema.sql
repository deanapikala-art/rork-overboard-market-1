-- Pickup Confirmation Codes Schema
-- Generates secure 6-digit codes for local pickup order verification

-- Add pickup code column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_confirmation_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code_generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code_verified_by TEXT;

-- Create index for code lookup
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON orders(pickup_confirmation_code);

-- Function to generate random 6-digit pickup code
CREATE OR REPLACE FUNCTION generate_pickup_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  is_unique BOOLEAN := FALSE;
BEGIN
  WHILE NOT is_unique LOOP
    -- Generate 6-digit numeric code
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if code is unique among active orders
    SELECT NOT EXISTS (
      SELECT 1 FROM orders 
      WHERE pickup_confirmation_code = code 
      AND is_local_pickup = true
      AND shipping_status NOT IN ('picked_up', 'delivered')
      AND created_at > NOW() - INTERVAL '30 days'
    ) INTO is_unique;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate pickup code for local pickup orders
CREATE OR REPLACE FUNCTION set_pickup_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate code for local pickup orders
  IF NEW.is_local_pickup = true AND NEW.pickup_confirmation_code IS NULL THEN
    NEW.pickup_confirmation_code := generate_pickup_code();
    NEW.pickup_code_generated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate pickup code on order creation/update
DROP TRIGGER IF EXISTS trigger_set_pickup_code ON orders;
CREATE TRIGGER trigger_set_pickup_code
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_pickup_code();

-- Function to verify pickup code
CREATE OR REPLACE FUNCTION verify_pickup_code(
  order_id_param UUID,
  code_param TEXT,
  verified_by_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  is_valid BOOLEAN := FALSE;
BEGIN
  -- Check if code matches and order is eligible for pickup
  UPDATE orders
  SET 
    shipping_status = 'picked_up',
    pickup_code_verified_at = NOW(),
    pickup_code_verified_by = verified_by_param,
    delivered_at = NOW(),
    delivery_confirmed_by = 'Vendor'
  WHERE 
    id = order_id_param
    AND pickup_confirmation_code = code_param
    AND is_local_pickup = true
    AND shipping_status IN ('pending', 'pickup_ready')
  RETURNING true INTO is_valid;
  
  RETURN COALESCE(is_valid, false);
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON COLUMN orders.pickup_confirmation_code IS 'Secure 6-digit code for local pickup verification';
COMMENT ON COLUMN orders.pickup_code_generated_at IS 'When the pickup code was generated';
COMMENT ON COLUMN orders.pickup_code_verified_at IS 'When the code was verified by vendor';
COMMENT ON COLUMN orders.pickup_code_verified_by IS 'Vendor ID who verified the pickup code';
COMMENT ON FUNCTION generate_pickup_code() IS 'Generates unique 6-digit numeric code for pickup verification';
COMMENT ON FUNCTION verify_pickup_code(UUID, TEXT, TEXT) IS 'Verifies pickup code and marks order as picked up';
