-- =====================================================
-- OVERBOARD MARKET - REPORTING SYSTEM SCHEMA
-- =====================================================

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reporter info
  reporter_id UUID NOT NULL,
  reporter_type TEXT NOT NULL CHECK (reporter_type IN ('customer', 'vendor', 'admin')),
  reporter_email TEXT,
  
  -- Target info
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('vendor', 'customer', 'product', 'order')),
  target_name TEXT,
  
  -- Report details
  report_type TEXT NOT NULL CHECK (report_type IN ('vendor_misconduct', 'buyer_misconduct', 'product_violation', 'harassment', 'scam', 'payment_issue', 'other')),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[], -- Array of URLs to screenshots/evidence
  
  -- Context
  order_id UUID,
  message_id UUID,
  
  -- Status & Resolution
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_admin_id UUID,
  admin_notes TEXT,
  resolution_notes TEXT,
  action_taken TEXT, -- warning, suspension, ban, refund_issued, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_target_id ON reports(target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_admin ON reports(assigned_admin_id);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Policy: Users can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Policy: Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Policy: Admins can update reports
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_timestamp
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();

-- Create function to auto-update reviewed_at and resolved_at
CREATE OR REPLACE FUNCTION update_report_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_review' AND OLD.status = 'open' THEN
    NEW.reviewed_at = NOW();
  END IF;
  
  IF NEW.status IN ('resolved', 'dismissed') AND OLD.status != NEW.status THEN
    NEW.resolved_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_status_timestamps_trigger
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_report_status_timestamps();

-- Sample data
COMMENT ON TABLE reports IS 'Trust & Safety reporting system for vendor, customer, and product violations';
COMMENT ON COLUMN reports.reporter_type IS 'Type of user submitting the report';
COMMENT ON COLUMN reports.target_type IS 'Type of entity being reported';
COMMENT ON COLUMN reports.report_type IS 'Category of the report';
COMMENT ON COLUMN reports.priority IS 'Admin-assigned priority level';
COMMENT ON COLUMN reports.action_taken IS 'Enforcement action applied (warning, suspension, ban, etc.)';
