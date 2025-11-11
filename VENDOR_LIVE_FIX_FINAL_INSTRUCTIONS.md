# Vendor Live Fix - Final Instructions

## Problem
The app is showing this error:
```
[VendorLive] Error fetching live vendors: column v.avatar does not exist
```

## Root Cause
The database function `get_live_vendors()` is trying to query `v.avatar` column, but the function in your Supabase database might be outdated or the column doesn't exist.

## Solution
Run the complete fix SQL script that will:
1. Verify all required columns exist in the vendors table (avatar, state, is_live, etc.)
2. Create all necessary tables for vendor live features
3. Recreate the `get_live_vendors()` function with the correct column references
4. Set up all required indexes and permissions
5. Test that everything works

## Steps to Fix

### 1. Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### 2. Run the Fix Script
1. Open the file: `app/utils/FINAL_VENDOR_LIVE_FIX.sql`
2. Copy the **entire contents** of the file
3. Paste it into the Supabase SQL Editor
4. Click "Run" button

### 3. Check for Success
Look at the results panel. You should see messages like:
```
✓ Avatar column already exists
✓ State column already exists
✓ is_live column already exists
✓ get_live_vendors() function executed successfully. Found 0 live vendors
✓ VENDOR LIVE FIX COMPLETED SUCCESSFULLY
```

### 4. Refresh Your App
After running the SQL script:
1. Refresh your web browser (or restart your Expo app)
2. The error should be gone
3. The vendor live features should work correctly

## What This Fix Does

### Tables Created/Updated
- **vendors** table: Adds avatar, state, is_live, live_platform, live_url, live_started_at columns
- **vendor_live_sessions** table: Tracks live streaming sessions
- **vendor_live_click_events** table: Tracks clicks on live streams

### Functions Created/Updated
- **get_live_vendors()**: Returns all currently live vendors with their details
- **record_live_click()**: Records when users click on live streams
- **auto_end_stale_live_sessions()**: Automatically ends sessions older than 6 hours

### Security
- Row Level Security (RLS) policies ensure vendors can only manage their own live sessions
- Public can view active live sessions (for shoppers to see who's live)

## Verification

After applying the fix, you can verify it worked by:

1. **Check the function exists:**
   - In Supabase SQL Editor, run: `SELECT * FROM get_live_vendors();`
   - It should return results without errors (might be empty if no vendors are live)

2. **Check the avatar column:**
   - In Supabase SQL Editor, run: `SELECT avatar FROM vendors LIMIT 1;`
   - It should return without errors

3. **Test in the app:**
   - Navigate to the Live page in your app
   - The error should be gone
   - If a vendor goes live, they should appear in the list

## Still Having Issues?

If you still see the error after running the SQL script:

1. **Clear your app cache:**
   - On web: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - On mobile: Close and reopen the app

2. **Check Supabase connection:**
   - Make sure your `lib/supabase.ts` has the correct project URL and API key
   - Check that your internet connection is stable

3. **Verify the SQL ran successfully:**
   - Check the Supabase SQL Editor results panel for any error messages
   - Make sure you copied the ENTIRE SQL file (it's a large file)

## Need Help?

If you continue to experience issues:
1. Check the Supabase logs for any database errors
2. Verify that your vendors table has the `avatar` column
3. Make sure the `get_live_vendors()` function is using `v.avatar` (not `v.logo_url`)
