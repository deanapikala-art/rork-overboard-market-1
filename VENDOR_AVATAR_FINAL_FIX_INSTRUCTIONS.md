# Final Fix for Vendor Avatar Column Error

## Problem
The `get_live_vendors()` function is trying to access `v.avatar` column which doesn't exist in the vendors table, causing the error:
```
column v.avatar does not exist
```

## Solution
Run the SQL migration to add the missing column and update the function.

## Steps to Fix

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the Fix Script**
   - Copy the contents of `app/utils/VENDOR_AVATAR_FINAL_FIX.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter

3. **Verify Success**
   - You should see a success message: "SUCCESS: Avatar column exists in vendors table"
   - If you see an error, read the error message and report it

4. **Test the App**
   - Refresh your app
   - The error should be gone
   - The live vendors feature should now work correctly

## What This Fix Does

1. Adds the `avatar` column to the `vendors` table (if missing)
2. Recreates the `get_live_vendors()` function to properly reference the avatar column
3. Verifies the column was added successfully

## Alternative: If You Want a Different Column Name

If your vendors table uses a different column name for the logo/avatar (like `logo_url`, `profile_image`, etc.), you can:

1. Check what column name your vendors table actually has:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'vendors' 
   ORDER BY ordinal_position;
   ```

2. Update the `get_live_vendors()` function to use that column name instead of `avatar`

## Need Help?

If the error persists after running this script, please provide:
1. The exact error message you're seeing
2. The output from running this SQL query:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'vendors';
   ```
