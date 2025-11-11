-- Customer Notifications Schema for Overboard Market
-- Provides real-time alerts to shoppers about orders, shipping, messages, and vendor updates

-- Customer Notifications Table
CREATE TABLE IF NOT EXISTS customer_notifications (
  notification_id TEXT PRIMARY KEY DEFAULT ('CNT-' || substr(md5(random()::text), 1, 8)),
  customer_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'OrderPlaced',
    'OrderConfirmed',
    'OrderShipped',
    'OrderDelivered',
    'VendorMessage',
    'ShippingUpdate',
    'DeliveryReminder',
    'ReviewRequest',
    'VendorFeatured',
    'OrderCanceled',
    'RefundProcessed'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_order TEXT,
  related_vendor TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'critical')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Customer Notification Preferences Table
CREATE TABLE IF NOT EXISTS customer_notification_preferences (
  id TEXT PRIMARY KEY DEFAULT ('CPRF-' || substr(md5(random()::text), 1, 8)),
  customer_id TEXT UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_in_app BOOLEAN NOT NULL DEFAULT TRUE,
  enable_email BOOLEAN NOT NULL DEFAULT TRUE,
  enable_push BOOLEAN NOT NULL DEFAULT TRUE,
  notify_order_placed BOOLEAN NOT NULL DEFAULT TRUE,
  notify_order_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  notify_order_shipped BOOLEAN NOT NULL DEFAULT TRUE,
  notify_order_delivered BOOLEAN NOT NULL DEFAULT TRUE,
  notify_vendor_messages BOOLEAN NOT NULL DEFAULT TRUE,
  notify_shipping_updates BOOLEAN NOT NULL DEFAULT TRUE,
  notify_review_requests BOOLEAN NOT NULL DEFAULT FALSE,
  mute_non_critical BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_notifications_customer_id ON customer_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_timestamp ON customer_notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_is_read ON customer_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_type ON customer_notifications(type);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_severity ON customer_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_related_order ON customer_notifications(related_order);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_notifications_updated_at
  BEFORE UPDATE ON customer_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_notifications_updated_at();

CREATE TRIGGER customer_notification_preferences_updated_at
  BEFORE UPDATE ON customer_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_notifications_updated_at();

-- Function to auto-archive old notifications (60+ days)
CREATE OR REPLACE FUNCTION archive_old_customer_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM customer_notifications
  WHERE timestamp < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Customers can only view their own notifications
CREATE POLICY customer_notifications_select_policy ON customer_notifications
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Customers can update their own notifications (mark as read)
CREATE POLICY customer_notifications_update_policy ON customer_notifications
  FOR UPDATE
  USING (auth.uid() = customer_id);

-- Customers can delete their own notifications
CREATE POLICY customer_notifications_delete_policy ON customer_notifications
  FOR DELETE
  USING (auth.uid() = customer_id);

-- System/vendors can insert notifications for customers
CREATE POLICY customer_notifications_insert_policy ON customer_notifications
  FOR INSERT
  WITH CHECK (TRUE);

-- Customers can view their own preferences
CREATE POLICY customer_preferences_select_policy ON customer_notification_preferences
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Customers can update their own preferences
CREATE POLICY customer_preferences_update_policy ON customer_notification_preferences
  FOR UPDATE
  USING (auth.uid() = customer_id);

-- Customers can insert their own preferences
CREATE POLICY customer_preferences_insert_policy ON customer_notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON customer_notification_preferences TO authenticated;

-- Comment documentation
COMMENT ON TABLE customer_notifications IS 'Stores all customer notifications for orders, shipping, messages, and vendor updates';
COMMENT ON TABLE customer_notification_preferences IS 'Stores customer notification preferences and delivery settings';
COMMENT ON COLUMN customer_notifications.type IS 'Type of notification: OrderPlaced, OrderConfirmed, OrderShipped, OrderDelivered, VendorMessage, etc.';
COMMENT ON COLUMN customer_notifications.severity IS 'Visual priority level: info, success, warning, critical';
COMMENT ON COLUMN customer_notification_preferences.mute_non_critical IS 'When enabled, only shows critical notifications';
