-- =====================================================
-- CRITICAL FIX: Add 'trustSafety' to Policy Type Enums
-- =====================================================
-- Issue: PolicyAcknowledgmentContext expects 'trustSafety' but SQL only allows 3 types
-- Affects: policy_texts, user_policy_acknowledgments, policy_update_notifications, policy_acknowledgment_stats

-- Step 1: Drop existing CHECK constraints
ALTER TABLE policy_texts DROP CONSTRAINT IF EXISTS policy_texts_policy_type_check;
ALTER TABLE user_policy_acknowledgments DROP CONSTRAINT IF EXISTS user_policy_acknowledgments_policy_type_check;
ALTER TABLE policy_update_notifications DROP CONSTRAINT IF EXISTS policy_update_notifications_policy_type_check;
ALTER TABLE policy_acknowledgment_stats DROP CONSTRAINT IF EXISTS policy_acknowledgment_stats_policy_type_check;

-- Step 2: Add new CHECK constraints with 'trustSafety' included
ALTER TABLE policy_texts 
  ADD CONSTRAINT policy_texts_policy_type_check 
  CHECK (policy_type IN ('terms', 'privacy', 'codeOfConduct', 'trustSafety'));

ALTER TABLE user_policy_acknowledgments 
  ADD CONSTRAINT user_policy_acknowledgments_policy_type_check 
  CHECK (policy_type IN ('terms', 'privacy', 'codeOfConduct', 'trustSafety'));

ALTER TABLE policy_update_notifications 
  ADD CONSTRAINT policy_update_notifications_policy_type_check 
  CHECK (policy_type IN ('terms', 'privacy', 'codeOfConduct', 'trustSafety'));

ALTER TABLE policy_acknowledgment_stats 
  ADD CONSTRAINT policy_acknowledgment_stats_policy_type_check 
  CHECK (policy_type IN ('terms', 'privacy', 'codeOfConduct', 'trustSafety'));

-- Step 3: Insert default Trust & Safety policy (if it doesn't exist)
INSERT INTO policy_texts (policy_type, version, title, content, requires_acknowledgment, is_active)
VALUES ('trustSafety', 1.0, 'Trust & Safety Policy', '{"sections": []}', false, true)
ON CONFLICT (policy_type, version) DO NOTHING;

-- Verify fix
SELECT policy_type, version, title, requires_acknowledgment, is_active
FROM policy_texts
ORDER BY policy_type;
