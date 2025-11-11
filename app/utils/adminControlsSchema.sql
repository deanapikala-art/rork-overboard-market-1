-- Admin Control Panel Schema
-- Comprehensive vendor management, review moderation, notifications, and audit logging

-- =============================================
-- 1. VENDOR NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS vendor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT NOT NULL,
  
  -- Notification Details
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'urgent')),
  
  -- Admin Info
  sent_by_admin_id UUID,
  sent_by_admin_email TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_sent_by_admin 
    FOREIGN KEY (sent_by_admin_id) 
    REFERENCES admin_users(id) 
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_id ON vendor_notifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_created_at ON vendor_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_is_read ON vendor_notifications(is_read);

-- =============================================
-- 2. VENDOR MANAGEMENT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS vendor_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT UNIQUE NOT NULL,
  
  -- Status Management
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Feature Settings
  featured_until TIMESTAMP WITH TIME ZONE,
  featured_position INTEGER,
  
  -- Admin Notes
  admin_notes TEXT,
  suspension_reason TEXT,
  
  -- Metadata
  suspended_by_admin_id UUID,
  suspended_at TIMESTAMP WITH TIME ZONE,
  featured_by_admin_id UUID,
  featured_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_suspended_by_admin 
    FOREIGN KEY (suspended_by_admin_id) 
    REFERENCES admin_users(id) 
    ON DELETE SET NULL,
    
  CONSTRAINT fk_featured_by_admin 
    FOREIGN KEY (featured_by_admin_id) 
    REFERENCES admin_users(id) 
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vendor_management_vendor_id ON vendor_management(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_management_is_featured ON vendor_management(is_featured);
CREATE INDEX IF NOT EXISTS idx_vendor_management_is_active ON vendor_management(is_active);

-- =============================================
-- 3. REVIEW MODERATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS review_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL,
  
  -- Review Content (cached for moderation)
  vendor_id TEXT NOT NULL,
  customer_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  
  -- Moderation Status
  is_approved BOOLEAN DEFAULT TRUE,
  is_reported BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Moderation Details
  report_reason TEXT,
  reported_by_user_id UUID,
  reported_at TIMESTAMP WITH TIME ZONE,
  
  moderated_by_admin_id UUID,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderation_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_moderated_by_admin 
    FOREIGN KEY (moderated_by_admin_id) 
    REFERENCES admin_users(id) 
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_review_moderation_review_id ON review_moderation(review_id);
CREATE INDEX IF NOT EXISTS idx_review_moderation_vendor_id ON review_moderation(vendor_id);
CREATE INDEX IF NOT EXISTS idx_review_moderation_is_approved ON review_moderation(is_approved);
CREATE INDEX IF NOT EXISTS idx_review_moderation_is_reported ON review_moderation(is_reported);

-- =============================================
-- 4. ORDER DISPUTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS order_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order Reference
  order_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  
  -- Parties Involved
  customer_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  
  -- Dispute Details
  issue TEXT NOT NULL,
  description TEXT,
  customer_evidence TEXT,
  vendor_response TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  
  -- Resolution
  resolution_notes TEXT,
  resolved_by_admin_id UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_order 
    FOREIGN KEY (order_id) 
    REFERENCES user_orders(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_customer 
    FOREIGN KEY (customer_id) 
    REFERENCES customers(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_resolved_by_admin 
    FOREIGN KEY (resolved_by_admin_id) 
    REFERENCES admin_users(id) 
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_disputes_order_id ON order_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_disputes_customer_id ON order_disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_disputes_vendor_id ON order_disputes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_disputes_status ON order_disputes(status);
CREATE INDEX IF NOT EXISTS idx_order_disputes_created_at ON order_disputes(created_at DESC);

-- =============================================
-- 5. ADMIN ACTIVITY LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Admin Info
  admin_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  
  -- Action Details
  action_type TEXT NOT NULL, -- 'suspend_vendor', 'activate_vendor', 'feature_vendor', 'send_notification', 'moderate_review', 'resolve_dispute', etc.
  target_type TEXT NOT NULL, -- 'vendor', 'review', 'order', 'dispute', 'customer'
  target_id TEXT NOT NULL,
  
  -- Change Details
  previous_state JSONB,
  new_state JSONB,
  notes TEXT,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_admin 
    FOREIGN KEY (admin_id) 
    REFERENCES admin_users(id) 
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON admin_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target_type ON admin_activity_log(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target_id ON admin_activity_log(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);

-- =============================================
-- 6. PRODUCT MODERATION TABLE (Optional)
-- =============================================
CREATE TABLE IF NOT EXISTS product_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product Info
  product_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  
  -- Status
  is_visible BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  
  -- Moderation
  flag_reason TEXT,
  flagged_by_admin_id UUID,
  flagged_at TIMESTAMP WITH TIME ZONE,
  moderation_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_flagged_by_admin 
    FOREIGN KEY (flagged_by_admin_id) 
    REFERENCES admin_users(id) 
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_product_moderation_product_id ON product_moderation(product_id);
CREATE INDEX IF NOT EXISTS idx_product_moderation_vendor_id ON product_moderation(vendor_id);
CREATE INDEX IF NOT EXISTS idx_product_moderation_is_visible ON product_moderation(is_visible);
CREATE INDEX IF NOT EXISTS idx_product_moderation_is_flagged ON product_moderation(is_flagged);

-- =============================================
-- 7. UPDATE TRIGGERS
-- =============================================

-- Trigger to update updated_at on vendor_management
CREATE OR REPLACE FUNCTION update_vendor_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vendor_management_updated_at
  BEFORE UPDATE ON vendor_management
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_management_updated_at();

-- Trigger to update updated_at on review_moderation
CREATE TRIGGER trigger_review_moderation_updated_at
  BEFORE UPDATE ON review_moderation
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_management_updated_at();

-- Trigger to update updated_at on order_disputes
CREATE TRIGGER trigger_order_disputes_updated_at
  BEFORE UPDATE ON order_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_management_updated_at();

-- Trigger to update updated_at on product_moderation
CREATE TRIGGER trigger_product_moderation_updated_at
  BEFORE UPDATE ON product_moderation
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_management_updated_at();

-- =============================================
-- 8. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_moderation ENABLE ROW LEVEL SECURITY;

-- Admin full access policies
CREATE POLICY "Admins have full access to vendor_notifications"
  ON vendor_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to vendor_management"
  ON vendor_management FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to review_moderation"
  ON review_moderation FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to order_disputes"
  ON order_disputes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to admin_activity_log"
  ON admin_activity_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to product_moderation"
  ON product_moderation FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Vendor can view their own notifications
CREATE POLICY "Vendors can view their own notifications"
  ON vendor_notifications FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors 
      WHERE user_id = auth.uid()
    )
  );

-- Vendor can mark their notifications as read
CREATE POLICY "Vendors can update their own notifications"
  ON vendor_notifications FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- 9. HELPER FUNCTIONS
-- =============================================

-- Function to send vendor notification
CREATE OR REPLACE FUNCTION send_vendor_notification(
  p_vendor_id TEXT,
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT,
  p_admin_id UUID,
  p_admin_email TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO vendor_notifications (
    vendor_id,
    title,
    message,
    severity,
    sent_by_admin_id,
    sent_by_admin_email
  ) VALUES (
    p_vendor_id,
    p_title,
    p_message,
    p_severity,
    p_admin_id,
    p_admin_email
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_id UUID,
  p_admin_email TEXT,
  p_action_type TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_previous_state JSONB,
  p_new_state JSONB,
  p_notes TEXT
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_activity_log (
    admin_id,
    admin_email,
    action_type,
    target_type,
    target_id,
    previous_state,
    new_state,
    notes
  ) VALUES (
    p_admin_id,
    p_admin_email,
    p_action_type,
    p_target_type,
    p_target_id,
    p_previous_state,
    p_new_state,
    p_notes
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to suspend vendor
CREATE OR REPLACE FUNCTION suspend_vendor(
  p_vendor_id TEXT,
  p_reason TEXT,
  p_admin_id UUID,
  p_admin_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update or insert vendor management record
  INSERT INTO vendor_management (
    vendor_id,
    is_active,
    is_suspended,
    suspension_reason,
    suspended_by_admin_id,
    suspended_at
  ) VALUES (
    p_vendor_id,
    FALSE,
    TRUE,
    p_reason,
    p_admin_id,
    NOW()
  )
  ON CONFLICT (vendor_id) DO UPDATE SET
    is_active = FALSE,
    is_suspended = TRUE,
    suspension_reason = p_reason,
    suspended_by_admin_id = p_admin_id,
    suspended_at = NOW();
  
  -- Log the action
  PERFORM log_admin_activity(
    p_admin_id,
    p_admin_email,
    'suspend_vendor',
    'vendor',
    p_vendor_id,
    jsonb_build_object('is_active', true, 'is_suspended', false),
    jsonb_build_object('is_active', false, 'is_suspended', true),
    p_reason
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to activate vendor
CREATE OR REPLACE FUNCTION activate_vendor(
  p_vendor_id TEXT,
  p_admin_id UUID,
  p_admin_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO vendor_management (
    vendor_id,
    is_active,
    is_suspended,
    suspension_reason,
    suspended_by_admin_id,
    suspended_at
  ) VALUES (
    p_vendor_id,
    TRUE,
    FALSE,
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (vendor_id) DO UPDATE SET
    is_active = TRUE,
    is_suspended = FALSE,
    suspension_reason = NULL,
    suspended_by_admin_id = NULL,
    suspended_at = NULL;
  
  PERFORM log_admin_activity(
    p_admin_id,
    p_admin_email,
    'activate_vendor',
    'vendor',
    p_vendor_id,
    jsonb_build_object('is_active', false),
    jsonb_build_object('is_active', true),
    'Vendor activated'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to feature vendor
CREATE OR REPLACE FUNCTION feature_vendor(
  p_vendor_id TEXT,
  p_duration_days INTEGER,
  p_admin_id UUID,
  p_admin_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO vendor_management (
    vendor_id,
    is_featured,
    featured_until,
    featured_by_admin_id,
    featured_at
  ) VALUES (
    p_vendor_id,
    TRUE,
    NOW() + (p_duration_days || ' days')::INTERVAL,
    p_admin_id,
    NOW()
  )
  ON CONFLICT (vendor_id) DO UPDATE SET
    is_featured = TRUE,
    featured_until = NOW() + (p_duration_days || ' days')::INTERVAL,
    featured_by_admin_id = p_admin_id,
    featured_at = NOW();
  
  PERFORM log_admin_activity(
    p_admin_id,
    p_admin_email,
    'feature_vendor',
    'vendor',
    p_vendor_id,
    jsonb_build_object('is_featured', false),
    jsonb_build_object('is_featured', true, 'featured_until', NOW() + (p_duration_days || ' days')::INTERVAL),
    'Vendor featured for ' || p_duration_days || ' days'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE vendor_notifications IS 'Stores notifications sent from admins to vendors';
COMMENT ON TABLE vendor_management IS 'Tracks vendor status, suspension, and featured status';
COMMENT ON TABLE review_moderation IS 'Stores review moderation data for admin oversight';
COMMENT ON TABLE order_disputes IS 'Tracks customer-vendor disputes for admin resolution';
COMMENT ON TABLE admin_activity_log IS 'Audit log of all admin actions for accountability';
COMMENT ON TABLE product_moderation IS 'Tracks product visibility and moderation flags';
