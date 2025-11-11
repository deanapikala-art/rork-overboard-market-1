-- Admin Notifications System Schema
-- This schema provides real-time notifications for marketplace events

-- =============================================
-- ADMIN NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id TEXT UNIQUE NOT NULL DEFAULT 'NTF-' || LPAD(nextval('notification_id_seq')::TEXT, 6, '0'),
  type TEXT NOT NULL CHECK (type IN (
    'order_confirmed',
    'order_shipped',
    'order_delivered',
    'dispute_filed',
    'low_rating',
    'new_vendor',
    'inactive_vendor',
    'featured_vendor_expiring',
    'revenue_milestone',
    'vendor_review'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_vendor TEXT,
  related_order TEXT,
  related_customer TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sequence for notification IDs
CREATE SEQUENCE IF NOT EXISTS notification_id_seq START 1;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_severity ON admin_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_related_vendor ON admin_notifications(related_vendor);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_related_order ON admin_notifications(related_order);

-- Update trigger
CREATE OR REPLACE FUNCTION update_admin_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_notifications_updated_at
  BEFORE UPDATE ON admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_notifications_updated_at();

-- =============================================
-- ADMIN PREFERENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'orders',
    'shipping',
    'vendors',
    'disputes',
    'ratings',
    'milestones'
  )),
  enable_in_app BOOLEAN NOT NULL DEFAULT true,
  enable_email BOOLEAN NOT NULL DEFAULT false,
  enable_push BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(admin_id, category)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_preferences_admin_id ON admin_preferences(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_preferences_category ON admin_preferences(category);

-- Update trigger
CREATE TRIGGER trigger_update_admin_preferences_updated_at
  BEFORE UPDATE ON admin_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_notifications_updated_at();

-- =============================================
-- NOTIFICATION TRIGGERS
-- =============================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_vendor TEXT DEFAULT NULL,
  p_related_order TEXT DEFAULT NULL,
  p_related_customer TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO admin_notifications (
    type,
    title,
    message,
    related_vendor,
    related_order,
    related_customer,
    severity
  ) VALUES (
    p_type,
    p_title,
    p_message,
    p_related_vendor,
    p_related_order,
    p_related_customer,
    p_severity
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order confirmations
CREATE OR REPLACE FUNCTION notify_order_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmed_by_vendor = true AND (OLD.confirmed_by_vendor IS NULL OR OLD.confirmed_by_vendor = false) THEN
    PERFORM create_admin_notification(
      'order_confirmed',
      'Order Confirmed',
      'Vendor ' || NEW.vendor_name || ' confirmed order ' || NEW.order_number || ' ($' || NEW.total || ')',
      NEW.vendor_id,
      NEW.id::TEXT,
      NEW.customer_id,
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_order_confirmed
  AFTER UPDATE ON user_orders
  FOR EACH ROW
  WHEN (NEW.confirmed_by_vendor = true AND (OLD.confirmed_by_vendor IS NULL OR OLD.confirmed_by_vendor = false))
  EXECUTE FUNCTION notify_order_confirmed();

-- Trigger for order shipping
CREATE OR REPLACE FUNCTION notify_order_shipped()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shipping_status = 'shipped' AND (OLD.shipping_status IS NULL OR OLD.shipping_status != 'shipped') THEN
    PERFORM create_admin_notification(
      'order_shipped',
      'Order Shipped',
      'Vendor ' || NEW.vendor_name || ' shipped order ' || NEW.order_number || ' via ' || COALESCE(NEW.shipping_provider, 'carrier'),
      NEW.vendor_id,
      NEW.id::TEXT,
      NEW.customer_id,
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_order_shipped
  AFTER UPDATE ON user_orders
  FOR EACH ROW
  WHEN (NEW.shipping_status = 'shipped')
  EXECUTE FUNCTION notify_order_shipped();

-- Trigger for order delivery
CREATE OR REPLACE FUNCTION notify_order_delivered()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shipping_status = 'delivered' AND (OLD.shipping_status IS NULL OR OLD.shipping_status != 'delivered') THEN
    PERFORM create_admin_notification(
      'order_delivered',
      'Order Delivered',
      'Order ' || NEW.order_number || ' from ' || NEW.vendor_name || ' was delivered successfully',
      NEW.vendor_id,
      NEW.id::TEXT,
      NEW.customer_id,
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_order_delivered
  AFTER UPDATE ON user_orders
  FOR EACH ROW
  WHEN (NEW.shipping_status = 'delivered')
  EXECUTE FUNCTION notify_order_delivered();

-- Trigger for new vendor signups
CREATE OR REPLACE FUNCTION notify_new_vendor()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_admin_notification(
    'new_vendor',
    'New Vendor Signup',
    'New vendor registered: ' || NEW.business_name || ' (' || NEW.email || ')',
    NEW.id,
    NULL,
    NULL,
    'info'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_vendor
  AFTER INSERT ON vendor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_vendor();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE admin_notifications
  SET is_read = true
  WHERE id = p_notification_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE admin_notifications
  SET is_read = true
  WHERE is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Delete old notifications (older than 60 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM admin_notifications
  WHERE created_at < NOW() - INTERVAL '60 days';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM admin_notifications
  WHERE is_read = false;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_preferences ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all notifications
CREATE POLICY admin_notifications_select_policy ON admin_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Allow admins to update notifications (mark as read)
CREATE POLICY admin_notifications_update_policy ON admin_notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Allow admins to manage their preferences
CREATE POLICY admin_preferences_all_policy ON admin_preferences
  FOR ALL
  USING (
    admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT, UPDATE ON admin_notifications TO authenticated;
GRANT ALL ON admin_preferences TO authenticated;
GRANT USAGE ON notification_id_seq TO authenticated;

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default preferences for existing admins
INSERT INTO admin_preferences (admin_id, category, enable_in_app, enable_email, enable_push)
SELECT 
  id,
  category,
  true,
  false,
  false
FROM admin_users
CROSS JOIN (
  VALUES ('orders'), ('shipping'), ('vendors'), ('disputes'), ('ratings'), ('milestones')
) AS categories(category)
ON CONFLICT (admin_id, category) DO NOTHING;

-- =============================================
-- COMPLETED
-- =============================================
-- Run this script in your Supabase SQL editor
-- All tables, triggers, and functions will be created automatically
