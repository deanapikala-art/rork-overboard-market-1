# Database Tables Fix Instructions

## Issues Identified

Your database has the following problems:

1. **Missing Tables**: `customer_carts` and `customer_favorites` tables don't exist
2. **Infinite Recursion**: Admin policy was checking itself recursively
3. **Schema Cache**: Supabase schema cache not refreshed after table creation

## Fix Steps

### 1. Run the SQL Fix

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the entire content of `app/utils/COMPLETE_DATABASE_TABLES_FIX.sql`
4. Click **Run** to execute

### 2. Refresh Schema Cache

After running the SQL:

1. Go to **Settings** → **API** in your Supabase dashboard
2. Click **"Refresh Schema Cache"** or **"Reload schema"**
3. Wait 10-30 seconds for the cache to refresh

### 3. Verify Tables Created

Go to **Table Editor** and verify these tables exist:
- ✅ `customers`
- ✅ `customer_carts` 
- ✅ `customer_favorites`
- ✅ `admin_users`
- ✅ `vendors`
- ✅ `products`

### 4. Test Functionality

Test each feature:
- [ ] Customer sign up
- [ ] Add items to cart
- [ ] Add favorite vendors
- [ ] Admin login (after creating admin user)

## Creating Your First Admin User

To create an admin account, you need to manually insert into the `admin_users` table:

### Option A: Via SQL Editor

```sql
-- First, create a regular auth user, then add them as admin
-- Replace with your admin email and the user ID from auth.users
INSERT INTO admin_users (id, email, full_name)
VALUES (
  'YOUR_USER_ID_FROM_AUTH_USERS',
  'admin@example.com',
  'Admin Name'
);
```

### Option B: Via Table Editor

1. Go to **Authentication** → **Users** in Supabase
2. Create a new user or find your existing user
3. Copy their **User UID**
4. Go to **Table Editor** → **admin_users**
5. Click **Insert Row**
6. Fill in:
   - `id`: Paste the User UID
   - `email`: Your admin email
   - `full_name`: Your name
7. Click **Save**

### Option C: Sign Up First, Then Promote

1. Sign up as a regular customer in your app
2. Go to Supabase **Authentication** → **Users**
3. Find your user and copy the User UID
4. Go to **SQL Editor** and run:
```sql
INSERT INTO admin_users (id, email, full_name)
VALUES (
  'PASTE_USER_UID_HERE',
  'your-email@example.com',
  'Your Name'
)
ON CONFLICT (id) DO NOTHING;
```

## Troubleshooting

### If tables still don't appear after running SQL:
1. Check for errors in SQL execution
2. Verify you're connected to the correct database
3. Refresh the schema cache (Settings → API)
4. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)

### If policies still have errors:
1. Run the SQL again (it will recreate policies)
2. Check the PostgreSQL logs in Supabase (Logs & Reports)

### If customer sign up still fails:
1. Verify the `customers` table exists
2. Check if the trigger `handle_new_customer_user` exists in Database → Functions
3. Check Supabase logs for detailed error messages

## What This Fix Does

1. **Creates missing tables**: `customer_carts`, `customer_favorites`
2. **Fixes admin policy**: Removes infinite recursion by simplifying the policy
3. **Sets up RLS**: Enables Row Level Security with proper policies
4. **Grants permissions**: Ensures authenticated users can access their data
5. **Creates triggers**: Auto-updates `updated_at` timestamps

## Notes

- This fix is safe to run multiple times (uses `IF NOT EXISTS` and `DROP IF EXISTS`)
- All customer data is protected by Row Level Security
- Admin checks happen in app code, not database policies
- Tables are properly indexed for performance
