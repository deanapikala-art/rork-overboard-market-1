-- =====================================================
-- CRITICAL FIX: Policy Acknowledgment RLS Admin Checks
-- =====================================================
-- Issue: RLS policies reference wrong column name for admin checks
-- Affects: policy_texts, user_policy_acknowledgments, policy_update_notifications

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Admins can manage policy texts" ON policy_texts;
DROP POLICY IF EXISTS "Admins can view all acknowledgments" ON user_policy_acknowledgments;
DROP POLICY IF EXISTS "Admins can manage all policy notifications" ON policy_update_notifications;
DROP POLICY IF EXISTS "Admins can view acknowledgment stats" ON policy_acknowledgment_stats;
DROP POLICY IF EXISTS "Admins can manage acknowledgment stats" ON policy_acknowledgment_stats;

-- Recreate policies with correct admin check
-- Uses admin_users.id instead of admin_users.admin_id

CREATE POLICY "Admins can manage policy texts"
  ON policy_texts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
  ));

CREATE POLICY "Admins can view all acknowledgments"
  ON user_policy_acknowledgments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
  ));

CREATE POLICY "Admins can manage all policy notifications"
  ON policy_update_notifications FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
  ));

CREATE POLICY "Admins can view acknowledgment stats"
  ON policy_acknowledgment_stats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
  ));

CREATE POLICY "Admins can manage acknowledgment stats"
  ON policy_acknowledgment_stats FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
  ));

-- Verify fix
SELECT 
  schemaname, 
  tablename, 
  policyname,
  'FIXED' as status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('policy_texts', 'user_policy_acknowledgments', 'policy_update_notifications', 'policy_acknowledgment_stats')
ORDER BY tablename, policyname;
