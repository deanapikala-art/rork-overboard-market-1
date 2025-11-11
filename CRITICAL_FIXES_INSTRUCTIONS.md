# 🚨 Critical Supabase Fixes — Run Immediately

These three SQL scripts fix critical bugs found during validation that prevent admin functions and policy management from working correctly.

---

## ⚡ Quick Fix (5 minutes)

Open your Supabase SQL Editor and run these **three scripts in order**:

### 1️⃣ Fix Policy RLS Admin Checks (2 min)
**File**: `app/utils/CRITICAL_FIX_POLICY_RLS.sql`

**What it fixes**: 
- Admin policies for `policy_texts`, `user_policy_acknowledgments`, `policy_update_notifications`
- Changes `admin_users.admin_id` → `admin_users.id`

**Impact**: 
- ✅ Admins can now manage policies
- ✅ Policy Editor works for admins
- ✅ Acknowledgment tracking accessible to admins

---

### 2️⃣ Fix Trust Score RLS Admin Checks (2 min)
**File**: `app/utils/CRITICAL_FIX_TRUST_RLS.sql`

**What it fixes**: 
- Admin policies for `trust_score_history`, `trust_recovery_goals`, `trust_admin_actions`
- Changes `admin_profiles` → `admin_users`

**Impact**: 
- ✅ Admins can view trust leaderboard
- ✅ Trust management dashboard works
- ✅ Recovery goal tracking accessible to admins

---

### 3️⃣ Add Trust & Safety Policy Type (1 min)
**File**: `app/utils/CRITICAL_FIX_ADD_TRUST_SAFETY_POLICY.sql`

**What it fixes**: 
- Adds `'trustSafety'` to CHECK constraints on all policy tables
- Inserts default Trust & Safety policy row

**Impact**: 
- ✅ Trust & Safety tab appears in Policy Center
- ✅ No constraint violations when storing Trust & Safety policy
- ✅ Matches TypeScript type definition

---

## 🧪 Verification

After running all three scripts, verify fixes with this query:

```sql
-- 1. Check all policies have correct admin checks
SELECT tablename, policyname
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'policy_texts', 
    'user_policy_acknowledgments', 
    'policy_update_notifications',
    'trust_score_history', 
    'trust_recovery_goals', 
    'trust_admin_actions'
  )
ORDER BY tablename;

-- 2. Verify Trust & Safety policy exists
SELECT policy_type, version, title, is_active
FROM policy_texts
WHERE policy_type = 'trustSafety';

-- 3. Confirm CHECK constraints updated
SELECT 
  table_name, 
  constraint_name, 
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%policy_type%'
ORDER BY table_name;
```

---

## ✅ Expected Results

After running fixes:

1. **Admin Login** → Can access Policy Editor
2. **Policy Center** → Shows 4 tabs (Privacy, Terms, Code of Conduct, **Trust & Safety**)
3. **Vendor Dashboard** → Trust Score visible
4. **Admin Dashboard** → Trust Leaderboard accessible

---

## 🔄 Next Steps

Once these critical fixes are applied:

1. ✅ Test admin login and policy management
2. ✅ Test vendor trust score display
3. ⚠️ **Create Orders Schema** (next priority — see main validation report)
4. ⚠️ Validate messaging schema

---

## 📊 Impact Summary

| System | Before | After |
|--------|--------|-------|
| Policy Management | ❌ Admins blocked | ✅ Full access |
| Trust Score Admin | ❌ Can't view | ✅ Full visibility |
| Policy Center | ⚠️ 3 tabs only | ✅ 4 tabs (complete) |
| RLS Security | ⚠️ Failing silently | ✅ Working correctly |

---

*These fixes resolve 3 of the 5 critical issues found during validation.*
*See SUPABASE_VALIDATION_REPORT.md for complete analysis.*
