-- ============================================
-- Fix Missing Database Columns
-- ============================================
-- This script adds missing columns that are causing runtime errors

-- ============================================
-- 1. Fix Orders Table - Add delivered_at column
-- ============================================
-- The delivered_at column is already in the schema but might not be in the actual database
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' 
    AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN user_orders.delivered_at IS 'Timestamp when delivery was confirmed (auto or manual)';
  END IF;
END $$;

-- ============================================
-- 2. Fix Policy Texts Table - Add is_active column
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'policy_texts' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE policy_texts ADD COLUMN is_active BOOLEAN DEFAULT true;
    COMMENT ON COLUMN policy_texts.is_active IS 'Whether this policy version is currently active';
    
    -- Update existing rows to be active
    UPDATE policy_texts SET is_active = true WHERE is_active IS NULL;
  END IF;
END $$;

-- ============================================
-- 3. Ensure all delivery tracking columns exist
-- ============================================
DO $$ 
BEGIN
  -- shipping_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' AND column_name = 'shipping_status'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN shipping_status TEXT DEFAULT 'pending';
  END IF;

  -- shipping_provider
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' AND column_name = 'shipping_provider'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN shipping_provider TEXT;
  END IF;

  -- tracking_number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN tracking_number TEXT;
  END IF;

  -- tracking_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' AND column_name = 'tracking_url'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN tracking_url TEXT;
  END IF;

  -- shipped_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' AND column_name = 'shipped_at'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN shipped_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- delivery_confirmed_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' AND column_name = 'delivery_confirmed_by'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN delivery_confirmed_by TEXT;
  END IF;

  -- auto_status_updates_enabled
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' AND column_name = 'auto_status_updates_enabled'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN auto_status_updates_enabled BOOLEAN DEFAULT false;
  END IF;

  -- tracking_provider_api
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' AND column_name = 'tracking_provider_api'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN tracking_provider_api TEXT;
  END IF;

  -- estimated_delivery_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' AND column_name = 'estimated_delivery_date'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN estimated_delivery_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- delivery_notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' AND column_name = 'delivery_notes'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN delivery_notes TEXT;
  END IF;

  -- is_local_pickup
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_orders' AND column_name = 'is_local_pickup'
  ) THEN
    ALTER TABLE user_orders ADD COLUMN is_local_pickup BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================
-- 4. Create indexes if they don't exist
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_orders_tracking_number ON user_orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_user_orders_shipping_status ON user_orders(shipping_status);
CREATE INDEX IF NOT EXISTS idx_policy_texts_active ON policy_texts(policy_type, is_active);

-- ============================================
-- 5. Verification Queries
-- ============================================
-- Run these to verify the columns exist:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_orders' AND column_name IN ('delivered_at', 'auto_status_updates_enabled');
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'policy_texts' AND column_name = 'is_active';

COMMENT ON SCRIPT IS 'Fixes missing database columns for orders and policy_texts tables';
