-- External Order Completion System Schema
-- This schema handles order tracking when customers pay vendors externally

-- UserOrders Table: Stores all orders created when customers click "Pay Vendor"
CREATE TABLE IF NOT EXISTS user_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  
  -- Customer Info
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  
  -- Vendor Info
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  
  -- Order Details
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Payment Info
  payment_method TEXT NOT NULL, -- 'external_paypal', 'external_venmo', 'external_cashapp', 'external_website', 'message_vendor'
  payment_url TEXT,
  external_transaction_id TEXT,
  
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'awaiting_vendor_confirmation', -- 'awaiting_vendor_confirmation', 'completed', 'cancelled'
  
  -- Vendor Confirmation
  confirmed_by_vendor BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  vendor_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_orders_customer_id ON user_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_vendor_id ON user_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_status ON user_orders(status);
CREATE INDEX IF NOT EXISTS idx_user_orders_order_number ON user_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_user_orders_created_at ON user_orders(created_at DESC);

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
  counter INTEGER;
BEGIN
  -- Format: ORD-YYYYMMDD-XXXX
  counter := (SELECT COUNT(*) + 1 FROM user_orders WHERE created_at::date = CURRENT_DATE);
  new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON user_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_orders_updated_at
  BEFORE UPDATE ON user_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Customers can view their own orders
CREATE POLICY "Customers can view their own orders"
  ON user_orders FOR SELECT
  USING (auth.uid() = customer_id);

-- Customers can insert their own orders
CREATE POLICY "Customers can create their own orders"
  ON user_orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Vendors can view orders for their store
-- Note: This assumes vendors have a way to authenticate and their vendor_id matches
-- You may need to adjust this based on your vendor authentication setup
CREATE POLICY "Vendors can view orders for their store"
  ON user_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = user_orders.vendor_id
      AND v.user_id = auth.uid()
    )
  );

-- Vendors can update orders for their store (for confirmation)
CREATE POLICY "Vendors can update orders for their store"
  ON user_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = user_orders.vendor_id
      AND v.user_id = auth.uid()
    )
  );

-- View for order analytics
CREATE OR REPLACE VIEW vendor_order_analytics AS
SELECT 
  vendor_id,
  vendor_name,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN status = 'awaiting_vendor_confirmation' THEN 1 END) as pending_orders,
  SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) as total_revenue,
  AVG(CASE WHEN status = 'completed' THEN total ELSE NULL END) as average_order_value,
  MIN(created_at) as first_order_date,
  MAX(created_at) as last_order_date
FROM user_orders
GROUP BY vendor_id, vendor_name;

COMMENT ON TABLE user_orders IS 'Stores orders created when customers complete purchases externally through vendor payment links';
COMMENT ON COLUMN user_orders.order_number IS 'Unique order identifier shown to customers and vendors';
COMMENT ON COLUMN user_orders.payment_method IS 'Type of external payment used (PayPal, Venmo, Cash App, vendor website, or message)';
COMMENT ON COLUMN user_orders.status IS 'Order status: awaiting_vendor_confirmation, completed, or cancelled';
COMMENT ON COLUMN user_orders.confirmed_by_vendor IS 'True when vendor confirms payment was received';
