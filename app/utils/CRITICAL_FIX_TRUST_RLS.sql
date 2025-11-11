-- =====================================================
-- CRITICAL FIX: Trust Score RLS Admin Checks
-- =====================================================
-- Issue: RLS policies reference 'admin_profiles' instead of 'admin_users'
-- Affects: trust_score_history, trust_recovery_goals, trust_admin_actions

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Admins can view all trust data" ON trust_score_history;
DROP POLICY IF EXISTS "Admins can view all recovery goals" ON trust_recovery_goals;
DROP POLICY IF EXISTS "Admins can view all trust actions" ON trust_admin_actions;

-- Recreate policies with correct table reference
-- Uses admin_users instead of admin_profiles

CREATE POLICY "Admins can view all trust data"
  ON trust_score_history FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all recovery goals"
  ON trust_recovery_goals FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all trust actions"
  ON trust_admin_actions FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Verify fix
SELECT 
  schemaname, 
  tablename, 
  policyname,
  'FIXED' as status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trust_score_history', 'trust_recovery_goals', 'trust_admin_actions')
ORDER BY tablename, policyname;
