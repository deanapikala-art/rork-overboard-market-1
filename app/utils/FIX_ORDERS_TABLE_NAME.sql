-- Fix for user_orders table name issue
-- This renames the 'orders' table to 'user_orders' to match the application code

-- Check if 'orders' table exists and 'user_orders' doesn't
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public')
       AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_orders' AND table_schema = 'public')
    THEN
        -- Rename the table
        ALTER TABLE orders RENAME TO user_orders;
        
        RAISE NOTICE 'Renamed orders table to user_orders';
        
        -- Rename indexes if they exist
        ALTER INDEX IF EXISTS idx_orders_customer_id RENAME TO idx_user_orders_customer_id;
        ALTER INDEX IF EXISTS idx_orders_vendor_id RENAME TO idx_user_orders_vendor_id;
        ALTER INDEX IF EXISTS idx_orders_status RENAME TO idx_user_orders_status;
        ALTER INDEX IF EXISTS idx_orders_order_number RENAME TO idx_user_orders_order_number;
        ALTER INDEX IF EXISTS idx_orders_created_at RENAME TO idx_user_orders_created_at;
        
        RAISE NOTICE 'Renamed all indexes';
    ELSIF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_orders' AND table_schema = 'public')
          AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public')
    THEN
        RAISE NOTICE 'Neither orders nor user_orders table exists. Please run ordersSchema.sql to create the table.';
    ELSE
        RAISE NOTICE 'user_orders table already exists. No action needed.';
    END IF;
END $$;
