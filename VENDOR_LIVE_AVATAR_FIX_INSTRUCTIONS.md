# Vendor Live Avatar Column Fix

## Error
```
[VendorLive] Error fetching live vendors: column v.avatar does not exist
```

## Solution

Run the SQL fix script in your Supabase SQL Editor:

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to SQL Editor

2. **Run the Fix Script**
   - Copy the contents of `app/utils/VENDOR_LIVE_AVATAR_COLUMN_FIX.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **What This Script Does**
   - ✅ Ensures the `avatar` column exists in the `vendors` table
   - ✅ Ensures the `state` column exists in the `vendors` table
   - ✅ Ensures all live-related columns exist (`is_live`, `live_platform`, `live_url`, `live_started_at`)
   - ✅ Creates an index for fast live vendor queries
   - ✅ Recreates the `get_live_vendors()` function with explicit type casting
   - ✅ Grants proper permissions to the function
   - ✅ Verifies the function works correctly

4. **Expected Output**
   The script will show notices like:
   ```
   Avatar column already exists in vendors table
   State column already exists in vendors table
   get_live_vendors() function executed successfully. Found X live vendors
   ```

## Why This Error Occurred

The `get_live_vendors()` PostgreSQL function references the `avatar` column, but either:
- The column wasn't created in your database, or
- There was a mismatch between the schema definition and the actual database structure

This fix ensures everything is aligned and working.

## Verification

After running the script:
1. The error should disappear from your app logs
2. The live vendors feature should work correctly
3. You can test by:
   - Going to the Vendor Dashboard
   - Clicking "Go Live"
   - Checking the Live page to see if vendors appear

## Need Help?

If you still see errors after running this script:
- Check the Supabase logs for any execution errors
- Verify you have the necessary permissions to modify the database schema
- Contact support at info@overboardnorth.com
