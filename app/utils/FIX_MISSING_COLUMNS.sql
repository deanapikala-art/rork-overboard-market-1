-- Fix missing database columns
-- Run this in your Supabase SQL Editor

-- 1. Add auto_status_updates_enabled column to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'auto_status_updates_enabled'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN auto_status_updates_enabled BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN orders.auto_status_updates_enabled IS 'Enable automatic status updates via tracking API';
  END IF;
END $$;

-- 2. Add is_active column to policy_texts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'policy_texts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE policy_texts 
    ADD COLUMN is_active BOOLEAN DEFAULT true;
    
    COMMENT ON COLUMN policy_texts.is_active IS 'Whether this policy version is currently active';
  END IF;
END $$;

-- 3. Update existing policy records to be active if they're the latest version
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'policy_texts' AND column_name = 'is_active'
  ) THEN
    UPDATE policy_texts p1
    SET is_active = true
    WHERE version = (
      SELECT MAX(version) 
      FROM policy_texts p2 
      WHERE p2.policy_type = p1.policy_type
    );
    
    UPDATE policy_texts p1
    SET is_active = false
    WHERE version < (
      SELECT MAX(version) 
      FROM policy_texts p2 
      WHERE p2.policy_type = p1.policy_type
    );
  END IF;
END $$;

-- Verify the changes
SELECT 'orders.auto_status_updates_enabled' as column_name, 
       EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'orders' AND column_name = 'auto_status_updates_enabled'
       ) as exists
UNION ALL
SELECT 'policy_texts.is_active' as column_name,
       EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'policy_texts' AND column_name = 'is_active'
       ) as exists;
