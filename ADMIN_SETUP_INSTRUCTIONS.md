# Admin Account Setup Instructions

## Step 1: Run the SQL Schema in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to "SQL Editor" in the left sidebar
4. Copy and paste the entire contents of `app/utils/supabaseSchema.sql` into the SQL editor
5. Click "Run" to execute the SQL commands

This will create all the necessary tables including:
- `admin_users` table for admin authentication
- `vendors` table for vendor management
- `products` table for product listings
- Proper Row Level Security (RLS) policies

## Step 2: Create Your Admin User Account

### 2A: Create the Auth User
1. In Supabase Dashboard, go to "Authentication" → "Users"
2. Click "Add user" or "Create new user"
3. Enter:
   - Email: `info@overboardnorth.com`
   - Password: `Mbfniajh2!`
   - If you see "Auto Confirm User" checkbox, check it
4. Click "Create user"
5. **Copy the User ID** (UUID) that appears - you'll need it in the next step

### 2A-Alt: If Auto Confirm is Not Available
If you don't see the "Auto Confirm User" option:

**Option 1: Disable Email Confirmation (Recommended for Dev)**
1. Go to "Authentication" → "Providers" → "Email"
2. Scroll down to find "Confirm email"
3. Toggle OFF "Enable email confirmations"
4. Save changes
5. Now create the user as described in 2A above

**Option 2: Manually Confirm After Creation**
1. Create the user as described in 2A
2. In the Users list, click on the user you just created
3. Look for the "email_confirmed_at" field
4. Click the edit icon and set it to the current timestamp
5. Save the changes

### 2B: Add to Admin Users Table
1. Go back to "SQL Editor"
2. Run this SQL command (replace `YOUR_USER_ID` with the UUID you copied):

```sql
INSERT INTO admin_users (id, email, full_name)
VALUES ('YOUR_USER_ID', 'info@overboardnorth.com', 'Admin');
```

For example:
```sql
INSERT INTO admin_users (id, email, full_name)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'info@overboardnorth.com', 'Admin');
```

## Step 3: Sign In to the Admin Portal

1. Start your dev server if it's not running: `bun expo start`
2. Navigate to `/admin-auth` page in your app
3. Sign in with:
   - Email: `info@overboardnorth.com`
   - Password: `Mbfniajh2!`

## What You Can Do as Admin

Once signed in, you'll have access to:

### Dashboard Tab
- View analytics and statistics
- See top performing vendors
- Sales by category breakdown
- Quick actions for common tasks
- Test database connection

### Applications Tab
- Review pending vendor applications
- Approve or reject vendor requests
- View vendor portfolios and business details

### Vendors Tab
- View all active vendors
- Click on any vendor to manage their:
  - Business details
  - Billing settings
  - Fee overrides
  - Account status (active/suspended)

### Events Tab
- Manage craft fair events
- Set event schedules
- Feature events on the entrance page
- View vendor registrations

### Announcements Tab
- Send announcements to all vendors
- Use quick message templates
- View announcement history

### Billing Tab
- Configure marketplace fees (one-time/monthly/annual)
- Set event participation fees
- Configure payment provider (Stripe/External)
- Set Stripe Price IDs
- Test checkout flows

## Managing Customers

To search and manage customers:

1. Sign in as admin
2. Navigate to the Dashboard
3. Use the search functionality to find customers by:
   - Name
   - Email address

You'll be able to:
- View customer profiles
- Edit customer details (name, phone, preferences)
- Delete customer accounts
- View order history
- Manage favorites and carts

## Managing Vendors

To manage vendors:

1. Go to the "Vendors" tab in admin panel
2. Click on any vendor to access their management page
3. You can:
   - Edit business information
   - Update contact details
   - Override marketplace/event fees
   - Change billing status
   - Suspend or activate accounts
   - Delete vendor accounts
   - View and manage their product listings

## Managing Products

From the vendor management page, you can:
- View all products for that vendor
- Delete individual product listings
- Update product status (active/inactive)
- View product details and pricing

## Security Notes

- Admin authentication uses Supabase Auth for security
- Row Level Security (RLS) ensures only admins can access sensitive data
- Admin status is verified on every database query
- Sessions are securely stored and automatically refreshed

## Troubleshooting

### "You do not have admin access" error
- Make sure you completed Step 2B above
- Verify the user ID in `admin_users` table matches your auth user ID
- Check that you're using the correct email/password

### Can't see vendors or customers
- Ensure the SQL schema was run completely
- Check that RLS policies are enabled
- Verify you're signed in as an admin

### Database connection errors
- Check your environment variables in the `env` file
- Verify Supabase project is running
- Use the "Test Database Connection" button in Dashboard tab

## Need Help?

Contact support if you encounter any issues during setup.
