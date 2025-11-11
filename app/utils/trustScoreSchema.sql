-- Trust Score System Schema for Overboard Market
-- Tracks vendor reputation and recovery progress

-- Add trust score fields to vendor_profiles
ALTER TABLE vendor_profiles
ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 70.00,
ADD COLUMN IF NOT EXISTS trust_tier TEXT DEFAULT 'New or Improving',
ADD COLUMN IF NOT EXISTS verified_vendor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_trust_score_update TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS warnings_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS disputes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS orders_fulfilled INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS positive_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS acknowledged_latest_policies BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trust_recovery_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trust_recovery_start TIMESTAMP,
ADD COLUMN IF NOT EXISTS trust_recovery_goals JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS trust_recovery_progress DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS trust_recovery_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trust_score_last_drop_reason TEXT;

-- Trust score history table for tracking changes over time
CREATE TABLE IF NOT EXISTS trust_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  tier TEXT NOT NULL,
  reason TEXT,
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- Trust score goals table for detailed tracking
CREATE TABLE IF NOT EXISTS trust_recovery_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  goal_description TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Admin trust actions log
CREATE TABLE IF NOT EXISTS trust_admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  admin_id UUID,
  action_type TEXT NOT NULL,
  notes TEXT,
  previous_score DECIMAL(5,2),
  new_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_trust_score ON vendor_profiles(trust_score);
CREATE INDEX IF NOT EXISTS idx_vendor_trust_tier ON vendor_profiles(trust_tier);
CREATE INDEX IF NOT EXISTS idx_vendor_verified ON vendor_profiles(verified_vendor);
CREATE INDEX IF NOT EXISTS idx_vendor_recovery_active ON vendor_profiles(trust_recovery_active);
CREATE INDEX IF NOT EXISTS idx_trust_history_vendor ON trust_score_history(vendor_id, calculated_at);
CREATE INDEX IF NOT EXISTS idx_recovery_goals_vendor ON trust_recovery_goals(vendor_id);

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(vendor_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  fulfillment_rate DECIMAL(5,2);
  avg_rating DECIMAL(5,2);
  dispute_ratio DECIMAL(5,2);
  total_orders INTEGER;
  fulfillment_points DECIMAL(5,2);
  review_points DECIMAL(5,2);
  dispute_points DECIMAL(5,2);
  policy_points DECIMAL(5,2);
  warning_points DECIMAL(5,2);
  final_score DECIMAL(5,2);
  vendor_record RECORD;
BEGIN
  SELECT * INTO vendor_record FROM vendor_profiles WHERE id = vendor_uuid;
  
  IF NOT FOUND THEN
    RETURN 70.00;
  END IF;
  
  -- Get total orders
  total_orders := GREATEST(vendor_record.orders_fulfilled, 1);
  
  -- Calculate fulfillment rate (35 points max)
  fulfillment_rate := vendor_record.orders_fulfilled::DECIMAL / total_orders;
  fulfillment_points := fulfillment_rate * 35;
  
  -- Calculate review score (25 points max)
  -- Assuming reviews are tracked elsewhere, use positive_reviews for now
  IF vendor_record.positive_reviews > 0 THEN
    review_points := 25.00;
  ELSE
    review_points := 15.00; -- Default for new vendors
  END IF;
  
  -- Calculate dispute score (15 points max)
  dispute_ratio := vendor_record.disputes_count::DECIMAL / total_orders;
  dispute_points := (1 - dispute_ratio) * 15;
  dispute_points := GREATEST(0, dispute_points);
  
  -- Policy compliance (15 points)
  IF vendor_record.acknowledged_latest_policies THEN
    policy_points := 15.00;
  ELSE
    policy_points := 0.00;
  END IF;
  
  -- Warnings penalty (10 points max)
  warning_points := GREATEST(0, 10 - (vendor_record.warnings_count * 2));
  
  -- Calculate final score
  final_score := fulfillment_points + review_points + dispute_points + policy_points + warning_points;
  final_score := LEAST(100.00, GREATEST(0.00, final_score));
  
  RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to determine trust tier
CREATE OR REPLACE FUNCTION determine_trust_tier(score DECIMAL(5,2))
RETURNS TEXT AS $$
BEGIN
  IF score >= 90 THEN
    RETURN 'Trusted Vendor';
  ELSIF score >= 75 THEN
    RETURN 'Verified & Reliable';
  ELSIF score >= 50 THEN
    RETURN 'New or Improving';
  ELSE
    RETURN 'Under Review';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update vendor trust score
CREATE OR REPLACE FUNCTION update_vendor_trust_score(vendor_uuid UUID)
RETURNS void AS $$
DECLARE
  new_score DECIMAL(5,2);
  new_tier TEXT;
  old_score DECIMAL(5,2);
  old_tier TEXT;
BEGIN
  SELECT trust_score, trust_tier INTO old_score, old_tier
  FROM vendor_profiles
  WHERE id = vendor_uuid;
  
  new_score := calculate_trust_score(vendor_uuid);
  new_tier := determine_trust_tier(new_score);
  
  UPDATE vendor_profiles
  SET 
    trust_score = new_score,
    trust_tier = new_tier,
    last_trust_score_update = NOW()
  WHERE id = vendor_uuid;
  
  -- Log to history
  INSERT INTO trust_score_history (vendor_id, score, tier, reason)
  VALUES (vendor_uuid, new_score, new_tier, 'Automatic recalculation');
  
  -- Check if recovery needed
  IF new_score < 75 AND old_score >= 75 THEN
    PERFORM initiate_trust_recovery(vendor_uuid);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to initiate trust recovery
CREATE OR REPLACE FUNCTION initiate_trust_recovery(vendor_uuid UUID)
RETURNS void AS $$
DECLARE
  vendor_record RECORD;
  drop_reason TEXT := '';
BEGIN
  SELECT * INTO vendor_record FROM vendor_profiles WHERE id = vendor_uuid;
  
  -- Determine drop reason
  IF vendor_record.disputes_count > 2 THEN
    drop_reason := 'Multiple unresolved disputes';
  ELSIF vendor_record.warnings_count > 1 THEN
    drop_reason := 'Policy warnings';
  ELSIF NOT vendor_record.acknowledged_latest_policies THEN
    drop_reason := 'Outstanding policy acknowledgments';
  ELSIF vendor_record.orders_fulfilled < 3 THEN
    drop_reason := 'Low order completion rate';
  ELSE
    drop_reason := 'Trust score threshold';
  END IF;
  
  UPDATE vendor_profiles
  SET 
    trust_recovery_active = true,
    trust_recovery_start = NOW(),
    trust_score_last_drop_reason = drop_reason,
    trust_recovery_progress = 0.00
  WHERE id = vendor_uuid;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE trust_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_recovery_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own trust history"
  ON trust_score_history FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can view their own recovery goals"
  ON trust_recovery_goals FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all trust data"
  ON trust_score_history FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all recovery goals"
  ON trust_recovery_goals FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all trust actions"
  ON trust_admin_actions FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));
