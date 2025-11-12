-- Fix missing auto_status_updates_enabled column in user_orders table
-- This column is required for delivery tracking functionality

ALTER TABLE user_orders 
ADD COLUMN IF NOT EXISTS auto_status_updates_enabled BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN user_orders.auto_status_updates_enabled IS 'Whether to use automatic carrier tracking';

-- Ensure tracking_provider_api column exists too
ALTER TABLE user_orders 
ADD COLUMN IF NOT EXISTS tracking_provider_api TEXT;

COMMENT ON COLUMN user_orders.tracking_provider_api IS 'API service used for tracking (EasyPost, 17Track, TrackingMore, etc.)';

-- Ensure estimated_delivery_date column exists
ALTER TABLE user_orders 
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN user_orders.estimated_delivery_date IS 'Expected delivery date from carrier';

-- Ensure delivery_notes column exists
ALTER TABLE user_orders 
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

COMMENT ON COLUMN user_orders.delivery_notes IS 'Additional delivery information or instructions';

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_orders_auto_tracking ON user_orders(auto_status_updates_enabled) WHERE auto_status_updates_enabled = true;
CREATE INDEX IF NOT EXISTS idx_user_orders_tracking_status ON user_orders(tracking_number, shipping_status) WHERE tracking_number IS NOT NULL;
