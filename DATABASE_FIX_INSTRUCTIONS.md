# 🔧 Complete Database & Authentication Fix

## 📋 Issues Identified

### 1. **Database Trigger Conflicts**
- Missing service role policies preventing triggers from inserting records
- Triggers not properly differentiating between customer, vendor, and admin signups
- No error handling causing silent failures

### 2. **Missing User Type Differentiation**
- ALL three auth contexts (Customer, Vendor, Admin) use the same Supabase auth instance
- No `user_type` being passed during signup to differentiate user roles
- Triggers don't check user type, causing wrong profile creation

### 3. **RLS Policy Issues**
- Policies created in wrong order (must create service role policies first)
- Missing grants before policy creation
- Conflicting policies blocking trigger execution

### 4. **Routing & Session Management**
- App always routes to welcome screen even when user is authenticated
- Multiple auth contexts checking sessions separately without coordination
- Vendor context using AsyncStorage without Supabase integration

---

## ✅ COMPLETE FIX - Step by Step

### **STEP 1: Run the Complete Database Fix**

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Open the file: `app/utils/COMPLETE_DATABASE_FIX.sql`
4. Copy the ENTIRE contents
5. Paste into Supabase SQL Editor
6. Click **RUN**
7. ✅ Verify at the bottom that you see:
   - Multiple policies created
   - Multiple triggers created
   - Grant statements succeeded

This fixes ALL database issues including:
- ✅ Proper RLS policies with service role access
- ✅ Separate trigger functions for customer, vendor, and admin
- ✅ Proper error handling
- ✅ Correct table structure
- ✅ All necessary permissions

---

### **STEP 2: Verify Database Setup**

Run these verification queries in Supabase SQL Editor:

```sql
-- Check if policies exist (should see multiple policies per table)
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Check if triggers exist (should see 3 triggers on auth.users)
SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;

-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%handle_new%';
```

---

### **STEP 3: Fix Code Issues**

The code needs updates to properly pass `user_type` during signup. I'll update the files next.

---

## 🎯 What Was Fixed

### Database Layer:
1. ✅ **Service role policies** - Triggers can now insert records
2. ✅ **User type checking** - Each trigger checks user_type before creating profiles
3. ✅ **Proper error handling** - Failures are logged but don't break auth
4. ✅ **Correct policy order** - Service role policies created first
5. ✅ **All tables created** - customers, admin_users, vendors, products, carts, favorites
6. ✅ **All grants applied** - Proper permissions for all roles

### Authentication:
- Customer auth will create customer profiles only
- Vendor auth will create vendor profiles only  
- Admin auth will create admin profiles only
- All three can coexist without conflicts

---

## 🧪 Testing After Fix

### Test Customer Signup:
1. Click "Customer" button on welcome screen
2. Sign up with new email
3. Should succeed and redirect to market selection
4. Check Supabase: `SELECT * FROM customers;` - should see your user

### Test Vendor Signup:
1. Click "Vendor" button on welcome screen
2. Sign up with different email
3. Should succeed and go to vendor dashboard
4. Check Supabase: `SELECT * FROM vendors;` - should see your vendor

### Test Admin Signup:
(Admin users must be created manually in database first)
1. In Supabase SQL Editor run:
```sql
-- First create the auth user, then the admin profile
INSERT INTO admin_users (id, email, full_name)
VALUES (
  'your-auth-user-id-here',
  'admin@example.com',
  'Admin Name'
);
```
2. Then use admin sign in with that email

---

## 📝 Common Errors & Solutions

### Error: "Database error saving new user"
- ✅ **Fixed** - Service role policies now allow trigger inserts

### Error: "User is not an admin"
- Create admin user manually in database first
- Admin profiles are not auto-created on signup

### Error: Multiple profiles created
- ✅ **Fixed** - Triggers now check user_type before creating profiles

### Error: "Email already exists"
- Each email can only be used once across ALL user types
- Use different emails for testing different user types

---

## 🔍 Monitoring & Debugging

### View Trigger Logs:
In Supabase Dashboard → Logs → Postgres Logs, filter for:
- "Customer trigger"
- "Admin trigger"  
- "Vendor trigger"

### Check Profile Creation:
```sql
-- See all customers
SELECT id, name, email, created_at FROM customers;

-- See all admins
SELECT id, email, full_name, created_at FROM admin_users;

-- See all vendors
SELECT id, email, business_name, status, created_at FROM vendors;
```

---

## ⚠️ Important Notes

1. **Run SQL script only ONCE** - It's idempotent but running multiple times is unnecessary
2. **Email uniqueness** - Each email can only exist once across all user types
3. **Admin creation** - Admins must be created manually, not via signup
4. **User type required** - All signups must include user_type in metadata
5. **Test on fresh emails** - Use new emails for testing to avoid conflicts

---

## 🆘 Still Having Issues?

If you still get errors after running the SQL script:

1. **Check Supabase Auth Settings:**
   - Dashboard → Authentication → Settings
   - Confirm "Enable email confirmations" is **OFF**
   - Confirm "Enable email OTP" is **OFF**

2. **Clear all test data:**
```sql
-- WARNING: This deletes all test users and profiles
DELETE FROM customers;
DELETE FROM vendors;  
DELETE FROM admin_users;
-- Then delete test users from auth.users in Supabase dashboard
```

3. **Check console logs:**
   - Look for "[CustomerAuth]", "[VendorAuth]", or "[AdminAuth]" logs
   - Check for SQL errors in Supabase Logs

4. **Verify environment variables:**
   - Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
   - Restart dev server: `bun expo start --clear`
