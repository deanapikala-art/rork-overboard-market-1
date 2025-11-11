-- Global Admin Analytics Dashboard Schema
-- Stores platform-wide aggregated statistics

CREATE TABLE IF NOT EXISTS admin_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Revenue Metrics
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Vendor Metrics
  total_vendors INTEGER DEFAULT 0,
  active_vendors INTEGER DEFAULT 0,
  new_vendors_this_month INTEGER DEFAULT 0,
  
  -- Customer Metrics
  total_customers INTEGER DEFAULT 0,
  active_shoppers INTEGER DEFAULT 0,
  
  -- Fulfillment Metrics
  fulfillment_rate DECIMAL(5, 2) DEFAULT 0,
  avg_delivery_time DECIMAL(5, 2) DEFAULT 0,
  
  -- Top Performers (stored as JSONB for flexibility)
  top_vendors JSONB DEFAULT '[]'::jsonb,
  top_products JSONB DEFAULT '[]'::jsonb,
  top_regions JSONB DEFAULT '[]'::jsonb,
  
  -- Reviews
  total_reviews INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  
  -- Time-based data
  sales_by_day JSONB DEFAULT '[]'::jsonb,
  sales_by_category JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on updated_at for quick retrieval of latest stats
CREATE INDEX IF NOT EXISTS idx_admin_stats_updated_at ON admin_stats(updated_at DESC);

-- Function to refresh admin stats
CREATE OR REPLACE FUNCTION refresh_admin_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_revenue DECIMAL(10, 2);
  v_total_orders INTEGER;
  v_avg_order_value DECIMAL(10, 2);
  v_active_vendors INTEGER;
  v_active_shoppers INTEGER;
  v_fulfillment_rate DECIMAL(5, 2);
  v_avg_delivery_time DECIMAL(5, 2);
BEGIN
  -- Calculate total revenue and orders from confirmed orders
  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(*)
  INTO 
    v_total_revenue,
    v_total_orders
  FROM user_orders
  WHERE confirmed_by_vendor = true;
  
  -- Calculate average order value
  IF v_total_orders > 0 THEN
    v_avg_order_value := v_total_revenue / v_total_orders;
  ELSE
    v_avg_order_value := 0;
  END IF;
  
  -- Count active vendors (vendors with at least 1 order in last 30 days)
  SELECT COUNT(DISTINCT vendor_id)
  INTO v_active_vendors
  FROM user_orders
  WHERE created_at >= NOW() - INTERVAL '30 days';
  
  -- Count active shoppers (unique customers with orders in last 30 days)
  SELECT COUNT(DISTINCT customer_id)
  INTO v_active_shoppers
  FROM user_orders
  WHERE created_at >= NOW() - INTERVAL '30 days';
  
  -- Calculate fulfillment rate (delivered / shipped)
  WITH shipped_orders AS (
    SELECT COUNT(*) as shipped_count
    FROM user_orders
    WHERE shipping_status IN ('shipped', 'in_transit', 'out_for_delivery', 'delivered')
  ),
  delivered_orders AS (
    SELECT COUNT(*) as delivered_count
    FROM user_orders
    WHERE shipping_status = 'delivered'
  )
  SELECT 
    CASE 
      WHEN s.shipped_count > 0 THEN (d.delivered_count::DECIMAL / s.shipped_count * 100)
      ELSE 0 
    END
  INTO v_fulfillment_rate
  FROM shipped_orders s, delivered_orders d;
  
  -- Calculate average delivery time
  SELECT 
    COALESCE(AVG(EXTRACT(EPOCH FROM (delivered_at - shipped_at)) / 86400), 0)
  INTO v_avg_delivery_time
  FROM user_orders
  WHERE shipped_at IS NOT NULL 
    AND delivered_at IS NOT NULL
    AND shipping_status = 'delivered';
  
  -- Insert new stats record
  INSERT INTO admin_stats (
    total_revenue,
    total_orders,
    avg_order_value,
    active_vendors,
    active_shoppers,
    fulfillment_rate,
    avg_delivery_time,
    updated_at
  ) VALUES (
    v_total_revenue,
    v_total_orders,
    v_avg_order_value,
    v_active_vendors,
    v_active_shoppers,
    v_fulfillment_rate,
    v_avg_delivery_time,
    NOW()
  );
  
END;
$$;

-- Create a trigger to refresh stats when orders change
CREATE OR REPLACE FUNCTION trigger_refresh_admin_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM refresh_admin_stats();
  RETURN NEW;
END;
$$;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'user_orders_stats_refresh'
  ) THEN
    CREATE TRIGGER user_orders_stats_refresh
    AFTER INSERT OR UPDATE OR DELETE ON user_orders
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_admin_stats();
  END IF;
END;
$$;

-- Initial stats calculation
SELECT refresh_admin_stats();
