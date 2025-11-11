# Fix: Vendor Avatar Column Error

## Problem
Error: `column v.avatar does not exist`

This happens when the `get_live_vendors()` function tries to access the `avatar` column, but it hasn't been created in your Supabase database yet.

## Solution
Run the following SQL file in your Supabase SQL Editor:

**File:** `app/utils/VENDOR_AVATAR_COLUMN_FIX.sql`

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to: **SQL Editor** (in the left sidebar)

2. **Run the Fix**
   - Click **"New Query"**
   - Copy and paste the entire contents of `app/utils/VENDOR_AVATAR_COLUMN_FIX.sql`
   - Click **"Run"** or press `Ctrl/Cmd + Enter`

3. **Verify the Fix**
   - The script will:
     - Add the `avatar` column to the `vendors` table if it doesn't exist
     - Re-create the `get_live_vendors()` function with correct column references
     - Ensure all vendor live columns exist
   - Refresh your app - the error should be gone!

## What This Does

The fix adds the `avatar` TEXT column to your `vendors` table. This column stores vendor profile images/logos that are displayed when vendors go live.

The function `get_live_vendors()` uses:
```sql
v.avatar AS logo_url
```

So it needs the `avatar` column to exist in the `vendors` table.

## After Running the Fix

The error will be resolved and the Vendor Live feature will work correctly:
- Live vendors will display with their avatars
- The "Live Now" page will load without errors
- Vendor profiles will show correctly in live sessions
