# 🚨 White Screen Fix Guide

## Problem
The app shows a white/blank screen because contexts are crashing during initialization when they try to query database columns that don't exist.

## Root Cause
Two contexts are failing:
1. **PolicyAcknowledgmentContext** - needs `version` and `is_active` columns in `policy_texts` table
2. **OrdersContext** - needs `delivered_at` and `auto_status_updates_enabled` columns in `orders` table

These contexts load during app startup in `_layout.tsx`, so if they crash, the entire app fails to render.

---

## ✅ Solution

### Step 1: Run SQL Migration in Supabase

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Migration**
   - Copy the entire contents of `app/utils/FIX_POLICY_AND_ORDERS_COLUMNS.sql`
   - Paste into the SQL Editor
   - Click **Run**

This will:
- Add `version` column to `policy_texts` table
- Add `is_active` column to `policy_texts` table
- Add `delivered_at` column to `orders` table
- Add `auto_status_updates_enabled` column to `orders` table
- Create performance indexes
- Populate existing records with appropriate values

### Step 2: Verify the Changes

Run these verification queries in Supabase SQL Editor:

```sql
-- Check policy_texts columns
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'policy_texts'
    AND column_name IN ('version', 'is_active')
ORDER BY column_name;

-- Check orders columns
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
    AND column_name IN ('delivered_at', 'auto_status_updates_enabled')
ORDER BY column_name;
```

You should see all 4 columns listed.

### Step 3: Clear Cache and Restart

```bash
bun expo start --clear
```

---

## What This Fixes

✅ **PolicyAcknowledgmentContext** will now successfully:
- Query and load policies with version numbers
- Filter active policies
- Track policy acknowledgments

✅ **OrdersContext** will now successfully:
- Track delivery timestamps
- Enable/disable automatic status updates
- Display delivery tracking information

✅ **App Initialization** will complete without crashes

---

## Expected Result

- ✅ App loads to the welcome screen
- ✅ No white screen
- ✅ No console errors about missing columns
- ✅ All contexts initialize properly
- ✅ Navigation works

---

## If Still Getting White Screen

1. **Check Console Logs**
   - Look for any errors during app startup
   - Check for other missing columns or database issues

2. **Verify Supabase Connection**
   - Check `lib/supabase.ts` configuration
   - Verify environment variables are set

3. **Check Auth State**
   - The app tries to load user data on startup
   - Make sure Supabase auth is configured properly

4. **Review Error Boundary**
   - The app has an ErrorBoundary in `_layout.tsx`
   - If there's a crash, it should show an error message
   - If you see pure white, the crash is happening before ErrorBoundary

---

## Prevention

To prevent this in the future:

1. **Always run database migrations** when pulling new code
2. **Check console logs** for database column errors
3. **Keep SQL schema files** in sync with context code
4. **Test contexts independently** before wrapping in providers

---

## Quick Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Ran FIX_POLICY_AND_ORDERS_COLUMNS.sql
- [ ] Verified columns exist with verification queries
- [ ] Cleared Metro cache: `bun expo start --clear`
- [ ] App loads without white screen
- [ ] No console errors about missing columns
