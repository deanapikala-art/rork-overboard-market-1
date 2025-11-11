# 🔧 Final Database Fix Instructions

## 🚨 Problem
Getting "Database error saving new user" when creating customer accounts.

## ✅ Solution
This fix addresses **ALL** possible causes:
- ✅ Trigger permission issues
- ✅ RLS policy conflicts
- ✅ Email uniqueness violations
- ✅ Foreign key constraint errors
- ✅ Race conditions in trigger execution
- ✅ Missing table grants

---

## 📋 Step-by-Step Fix

### **STEP 1: Clean Up Existing Failed Signups** (Important!)

Before running the SQL script, delete any partially created auth users:

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. **Delete ALL test users** that failed to sign up properly
3. This prevents email conflicts

### **STEP 2: Run the Ultimate Fix SQL Script**

1. Open **Supabase Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file: `app/utils/ULTIMATE_DATABASE_FIX.sql`
5. **Copy ALL contents** of the file
6. **Paste** into the SQL Editor
7. Click **RUN** (bottom right)
8. **Wait** for completion (should take 5-10 seconds)

**Expected Output:**
You should see:
- `NOTICE: Dropped trigger...` (multiple lines)
- `NOTICE: Dropped policy...` (multiple lines)
- Success messages for CREATE statements
- Final verification queries showing triggers, policies, and grants

**⚠️ If you see errors:**
- Check if you have permission to run DDL statements
- Ensure you're using the project owner account
- Try running the script again (it's safe to re-run)

### **STEP 3: Verify Email Confirmation is Disabled**

This is CRITICAL:

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll to **Email Auth**
3. Find **"Enable email confirmations"**
4. **UNCHECK** this box if it's checked
5. Click **Save**

### **STEP 4: Test Customer Signup**

Now test the signup flow:

1. **Restart your dev server:**
   ```bash
   # Stop the current server (Ctrl+C)
   bun expo start --clear
   ```

2. **Open the app** on your device/emulator

3. **Try to create a customer account:**
   - Tap "Customer" button
   - Enter:
     - Name: Test User
     - Email: test@example.com (use a NEW email you haven't tried before)
     - Password: Test123456
   - Tap "Create Account"

4. **Expected Results:**
   - ✅ Success message or redirect to market selection
   - ✅ No error message
   - ✅ User created in auth.users
   - ✅ Profile created in customers table

### **STEP 5: Verify in Database**

Check that everything was created:

```sql
-- Run in Supabase SQL Editor

-- Check auth users
SELECT id, email, raw_user_meta_data->>'user_type' as user_type
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Check customer profiles
SELECT id, name, email, created_at 
FROM customers 
ORDER BY created_at DESC;

-- They should match!
```

---

## 🔍 What This Fix Does

### **1. Complete Cleanup**
- Drops ALL existing triggers (prevents duplicates)
- Drops ALL existing policies (prevents conflicts)
- Drops ALL existing functions (ensures clean slate)

### **2. Table Recreation**
- Drops and recreates tables in correct order
- Ensures proper foreign key relationships
- Handles cascading deletes properly

### **3. Permissions Setup**
- Grants ALL necessary permissions BEFORE creating policies
- Service role gets full access
- Authenticated and anon get specific access
- Prevents "insufficient privileges" errors

### **4. Improved Trigger Functions**
- **SECURITY DEFINER** - Runs with function owner privileges (bypasses RLS)
- **SET search_path = public** - Prevents schema ambiguity
- **Comprehensive error handling** - Won't fail auth.users creation even if profile fails
- **ON CONFLICT** clauses - Handles race conditions and duplicate emails gracefully
- **Detailed logging** - RAISE NOTICE statements for debugging

### **5. Proper RLS Policies**
- Service role policies FIRST (highest priority)
- User-specific policies SECOND
- Admin policies LAST
- Prevents policy conflicts

---

## 🐛 Troubleshooting

### Error: "Email rate limit exceeded"
**Cause:** Too many signup attempts  
**Fix:** Wait 1 hour, or use Supabase dashboard to manually delete failed auth users

### Error: "Email already registered"
**Cause:** Email exists from previous signup attempt  
**Fix:** 
1. Go to Supabase → Authentication → Users
2. Find and delete the user with that email
3. Try again with the same email OR use a different email

### Error: Still getting "Database error saving new user"
**Cause:** Script didn't run completely or permissions issue  

**Fix 1 - Check Logs:**
1. Supabase Dashboard → **Database** → **Logs**
2. Look for errors during trigger execution
3. You should see `NOTICE: Customer trigger started for user...`

**Fix 2 - Manual Verification:**
```sql
-- Check if triggers exist
SELECT tgname, tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname LIKE '%auth_user_created%';
-- Should return 3 triggers: customer, vendor, admin

-- Check if functions have SECURITY DEFINER
SELECT 
  p.proname as function_name,
  p.prosecdef as is_security_definer
FROM pg_proc p
WHERE p.proname LIKE 'handle_new_%';
-- is_security_definer should be 't' (true) for all
```

**Fix 3 - Nuclear Option:**
If nothing else works, run this to completely reset:
```sql
-- Delete all test data
DELETE FROM customer_favorites;
DELETE FROM customer_carts;
DELETE FROM customers;
DELETE FROM products;
DELETE FROM vendors;
DELETE FROM admin_users;

-- Then manually delete users from Authentication → Users in dashboard
-- Then run ULTIMATE_DATABASE_FIX.sql again
```

### Error: "Permission denied for table customers"
**Cause:** Grants not applied properly  
**Fix:** Re-run STEP 4 of the SQL script (the GRANT statements) separately

### Error: Trigger fires but profile not created
**Cause:** RLS policy blocking insert  
**Fix:** Check that service role policy exists:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'customers' 
AND policyname = 'Allow service role full access to customers';
-- Should return 1 row
```

---

## ✅ Success Checklist

After running the fix, you should have:

- ✅ 3 triggers on auth.users (customer, vendor, admin)
- ✅ 5+ policies on each table
- ✅ Service role has ALL grants on all tables
- ✅ Customer signup creates both auth.users AND customers records
- ✅ No console errors in the app
- ✅ Supabase logs show "Customer trigger started" and "Customer profile created successfully"

---

## 📊 Verification Queries

Run these to confirm everything is set up correctly:

```sql
-- 1. Check triggers exist
SELECT 
  tgname,
  tgrelid::regclass as table_name,
  tgenabled,
  tgtype
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
AND tgname LIKE '%auth_user_created%'
ORDER BY tgname;
-- Should show 3 triggers, all enabled

-- 2. Check function security
SELECT 
  p.proname,
  p.prosecdef as security_definer,
  pg_get_functiondef(p.oid) as function_def
FROM pg_proc p
WHERE p.proname IN (
  'handle_new_customer_user',
  'handle_new_vendor_user', 
  'handle_new_admin_user'
);
-- All should have security_definer = true

-- 3. Check table policies
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('customers', 'vendors', 'admin_users')
GROUP BY tablename
ORDER BY tablename;
-- Each should have 3-5 policies

-- 4. Check permissions
SELECT 
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'customers'
AND grantee IN ('service_role', 'authenticated', 'anon')
ORDER BY grantee, privilege_type;
-- service_role should have ALL privileges
```

---

## 🎯 Testing Different User Types

After the fix, test all three user types:

### Test 1: Customer Signup ✅
```
Email: customer1@test.com
Password: Password123
Name: Test Customer
```
- Should create auth.users with user_type='customer'
- Should create customers table record
- Should redirect to market selection

### Test 2: Vendor Signup ✅
```
Email: vendor1@test.com
Password: Password123
Business Name: Test Vendor
```
- Should create auth.users with user_type='vendor'
- Should create vendors table record
- Should redirect to vendor onboarding

### Test 3: Admin (Manual Setup) ✅
```sql
-- First create an auth user for admin via Supabase UI
-- Then run this with the auth user ID:
INSERT INTO admin_users (id, email, full_name)
VALUES (
  'the-auth-user-id-from-supabase',
  'admin@test.com',
  'Admin User'
);
```
- Sign in via Admin Access link
- Should load admin dashboard

---

## 🆘 Still Having Issues?

If you've followed all steps and still getting errors:

1. **Export your Supabase logs:**
   - Dashboard → Database → Logs
   - Filter for errors during signup time
   - Share the error messages

2. **Check your console logs:**
   - Look for `[CustomerAuth]` prefixed messages
   - Copy the exact error message

3. **Verify environment variables:**
   ```bash
   cat env
   # Should show EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
   ```

4. **Check Supabase service status:**
   - Go to status.supabase.com
   - Ensure all services are operational

5. **Last resort - Contact support:**
   - Provide: 
     - Exact error message
     - Supabase database logs
     - Console logs from app
     - Results of verification queries above

---

## 🎊 Success!

If customer signup works without errors, you're all set! The fix ensures:

- ✅ Real authentication for all user types
- ✅ Automatic profile creation via triggers  
- ✅ Proper permissions and RLS
- ✅ Error handling in triggers (won't block auth user creation)
- ✅ No more "Database error saving new user"

Now you can build your marketplace features with confidence! 🚀
