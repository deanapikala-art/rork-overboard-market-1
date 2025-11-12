-- =====================================================
-- Fix Missing Columns in policy_texts and orders Tables
-- =====================================================
-- This migration adds missing columns that the app expects
-- Run this in your Supabase SQL editor
-- =====================================================

-- Fix policy_texts table
-- Add version column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'policy_texts' 
        AND column_name = 'version'
    ) THEN
        ALTER TABLE policy_texts ADD COLUMN version integer DEFAULT 1 NOT NULL;
        
        -- Set version based on created_at for existing records
        WITH numbered_policies AS (
            SELECT 
                id,
                policy_type,
                ROW_NUMBER() OVER (PARTITION BY policy_type ORDER BY created_at) as row_num
            FROM policy_texts
        )
        UPDATE policy_texts pt
        SET version = np.row_num
        FROM numbered_policies np
        WHERE pt.id = np.id;
        
        RAISE NOTICE 'Added version column to policy_texts';
    ELSE
        RAISE NOTICE 'version column already exists in policy_texts';
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'policy_texts' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE policy_texts ADD COLUMN is_active boolean DEFAULT true NOT NULL;
        
        -- Keep only the latest version of each policy active
        WITH latest_policies AS (
            SELECT DISTINCT ON (policy_type) id, policy_type
            FROM policy_texts
            ORDER BY policy_type, version DESC
        )
        UPDATE policy_texts pt
        SET is_active = CASE 
            WHEN EXISTS (SELECT 1 FROM latest_policies lp WHERE lp.id = pt.id) 
            THEN true 
            ELSE false 
        END;
        
        RAISE NOTICE 'Added is_active column to policy_texts';
    ELSE
        RAISE NOTICE 'is_active column already exists in policy_texts';
    END IF;
END $$;

-- Fix orders table
-- Add delivered_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivered_at timestamp with time zone;
        
        -- Set delivered_at for orders with 'delivered' status
        UPDATE orders 
        SET delivered_at = updated_at 
        WHERE status = 'delivered' AND delivered_at IS NULL;
        
        RAISE NOTICE 'Added delivered_at column to orders';
    ELSE
        RAISE NOTICE 'delivered_at column already exists in orders';
    END IF;
END $$;

-- Add auto_status_updates_enabled column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'auto_status_updates_enabled'
    ) THEN
        ALTER TABLE orders ADD COLUMN auto_status_updates_enabled boolean DEFAULT true NOT NULL;
        
        RAISE NOTICE 'Added auto_status_updates_enabled column to orders';
    ELSE
        RAISE NOTICE 'auto_status_updates_enabled column already exists in orders';
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_policy_texts_version 
    ON policy_texts(policy_type, version DESC);
    
CREATE INDEX IF NOT EXISTS idx_policy_texts_is_active 
    ON policy_texts(is_active, policy_type);
    
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at 
    ON orders(delivered_at) WHERE delivered_at IS NOT NULL;

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these to verify the changes

-- Check policy_texts columns
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'policy_texts'
    AND column_name IN ('version', 'is_active')
ORDER BY column_name;

-- Check orders columns
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
    AND column_name IN ('delivered_at', 'auto_status_updates_enabled')
ORDER BY column_name;

-- Check policy_texts data
SELECT 
    policy_type, 
    version, 
    is_active, 
    created_at 
FROM policy_texts 
ORDER BY policy_type, version DESC;

-- Check orders with new columns
SELECT 
    id, 
    status, 
    delivered_at, 
    auto_status_updates_enabled,
    created_at,
    updated_at
FROM orders 
LIMIT 5;
