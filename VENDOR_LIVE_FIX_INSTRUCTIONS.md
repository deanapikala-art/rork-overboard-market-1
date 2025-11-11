# Vendor Live Feature Fix Instructions

## Issue
The `get_live_vendors()` database function was failing with error:
```
column v.avatar does not exist
```

## Root Cause
The SQL function was selecting columns that didn't exist or weren't properly aliased in the vendors table.

## Solution
Run the SQL fix script in your Supabase SQL Editor to:
1. Add the missing `state` column to the vendors table
2. Fix the `get_live_vendors()` function to properly alias `avatar` as `logo_url`

## Steps to Fix

### Option 1: Run the Complete Fix (Recommended)
Open your Supabase SQL Editor and run:
```sql
app/utils/VENDOR_LIVE_COMPLETE_FIX.sql
```

### Option 2: Run the Updated Schema
If you haven't run the vendor live schema yet, use the updated version:
```sql
app/utils/vendorLiveSchema.sql
```

## What Was Fixed

### Before:
```sql
SELECT 
  v.id,
  v.business_name,
  v.state,           -- ❌ Column didn't exist
  v.avatar,          -- ❌ Not aliased as logo_url
  ...
```

### After:
```sql
-- Added state column to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS state text;

-- Fixed the function
SELECT 
  v.id,
  v.business_name,
  v.state,              -- ✅ Column now exists
  v.avatar AS logo_url, -- ✅ Properly aliased
  ...
```

## Verification
After running the SQL fix:
1. Check the app console logs - the "[VendorLive] Error fetching live vendors" should be gone
2. Try going live as a vendor
3. Check that live vendors appear correctly in the app

## Notes
- The `state` column is now optional on the vendors table
- If you have existing vendors with locations like "City, State", you can optionally populate the state column using the helper function provided in the fix
- The function now properly aliases `avatar` as `logo_url` to match the TypeScript interface
