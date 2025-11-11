# Admin Control Panel Implementation Guide

## 🎯 Overview

The Admin Control Panel gives marketplace administrators powerful tools to manage vendors, moderate reviews, handle disputes, send notifications, and maintain audit logs for all administrative actions.

## 📋 Features Implemented

### 1. **Vendor Management**
- ✅ Suspend/Activate vendors
- ✅ Feature/Unfeature vendors (with duration settings)
- ✅ View vendor status (Active, Suspended, Featured)
- ✅ Send individual notifications to vendors
- ✅ Send bulk notifications to all vendors

### 2. **Review Moderation**
- ✅ View all reviews across the platform
- ✅ See reported reviews with flag badges
- ✅ Approve or delete reviews
- ✅ View report reasons
- ✅ Track moderation history

### 3. **Order Disputes**
- ✅ View all customer-vendor disputes
- ✅ Update dispute status (Open → Under Review → Resolved)
- ✅ Add resolution notes
- ✅ Track dispute history by order

### 4. **Notifications System**
- ✅ Send targeted notifications to specific vendors
- ✅ Send bulk announcements to all vendors
- ✅ Set severity levels (Info, Warning, Urgent)
- ✅ View notification history
- ✅ Track read/unread status

### 5. **Audit Logging**
- ✅ Complete activity log of all admin actions
- ✅ Track who, what, when for accountability
- ✅ Store previous and new states for rollback capability
- ✅ Filter by action type, date, target

## 🗄️ Database Schema

The system uses 6 main tables:

### `vendor_management`
Tracks vendor status and featured status
```sql
- vendor_id (unique)
- is_active, is_suspended, is_featured
- featured_until, featured_position
- admin_notes, suspension_reason
```

### `vendor_notifications`
Stores all notifications sent to vendors
```sql
- vendor_id
- title, message, severity
- sent_by_admin_id, sent_by_admin_email
- is_read, read_at
```

### `review_moderation`
Tracks review approval and reports
```sql
- review_id
- is_approved, is_reported, is_deleted
- report_reason, moderation_notes
- moderated_by_admin_id
```

### `order_disputes`
Manages customer-vendor disputes
```sql
- order_id, order_number
- customer_id, vendor_id
- issue, description, status
- resolution_notes, resolved_by_admin_id
```

### `admin_activity_log`
Complete audit trail
```sql
- admin_id, admin_email
- action_type, target_type, target_id
- previous_state, new_state (JSONB)
- notes
```

### `product_moderation` (Optional)
Tracks product visibility flags
```sql
- product_id, vendor_id
- is_visible, is_flagged
- flag_reason, moderation_notes
```

## 📦 Setup Instructions

### Step 1: Run Database Schema

Execute the SQL schema file to create all necessary tables:

```bash
# In your Supabase SQL Editor, run:
app/utils/adminControlsSchema.sql
```

This will create:
- All 6 tables with proper indexes
- Row Level Security (RLS) policies
- Helper functions for common operations
- Automated triggers for timestamps

### Step 2: Verify Context Integration

The `AdminControlsContext` is already integrated in `app/_layout.tsx`:

```tsx
<AdminAuthProvider>
  <AdminStatsProvider>
    <AdminControlsProvider>
      {/* Rest of providers */}
    </AdminControlsProvider>
  </AdminStatsProvider>
</AdminAuthProvider>
```

### Step 3: Access the Controls Panel

Navigate to the Admin Panel and click the **"Controls"** tab to access:
- Vendor Management
- Review Moderation
- Order Disputes
- Notifications History

## 🔒 Security & Permissions

### Row Level Security (RLS)
All tables have RLS enabled with policies that:
- Grant full access to authenticated admin users
- Allow vendors to view their own notifications
- Allow vendors to mark their notifications as read
- Block unauthorized access to sensitive data

### Admin Authentication
Only users in the `admin_users` table can:
- Access the Admin Control Panel
- Perform vendor management actions
- Moderate reviews and resolve disputes
- Send notifications

## 🎨 UI Components

### AdminControlsPanel
Main component with 4 tabs:
1. **Vendors** - Manage vendor status and featured listings
2. **Reviews** - Moderate and approve/delete reviews
3. **Disputes** - Handle customer-vendor disputes
4. **Notifications** - View sent notifications history

### Key Features:
- Real-time updates when actions complete
- Confirmation dialogs for destructive actions
- Modal forms for notifications and featuring
- Status badges and severity indicators
- Empty states for each section

## 📱 Responsive Design

The control panel is fully responsive across:
- **Mobile (iPhone/Android)**: Single-column layout with stacked actions
- **Tablet (iPad)**: Optimized card layouts
- **Web**: Full-width dashboard view

## 🔧 API Functions

### Vendor Management
```typescript
suspendVendor(vendorId: string, reason: string)
activateVendor(vendorId: string)
featureVendor(vendorId: string, durationDays: number)
unfeatureVendor(vendorId: string)
```

### Notifications
```typescript
sendNotification(vendorId, title, message, severity)
sendBulkNotification(title, message, severity)
```

### Review Moderation
```typescript
deleteReview(reviewId: string, reason: string)
approveReview(reviewId: string)
flagReview(reviewId: string, reason: string)
```

### Dispute Management
```typescript
createDispute(orderId, issue, description)
updateDisputeStatus(disputeId, status, notes)
resolveDispute(disputeId, resolutionNotes)
```

## 📊 Analytics Integration

The Admin Controls system integrates with `AdminStatsContext` to provide:
- Total suspended vendors count
- Average resolution time for disputes
- Review moderation rates
- Featured vendor performance tracking

## 🚀 Usage Examples

### Suspend a Vendor
1. Navigate to Admin → Controls → Vendors
2. Find the vendor card
3. Click "Suspend"
4. Enter suspension reason
5. System logs the action and updates vendor status

### Feature a Vendor
1. Click "Feature" button on vendor card
2. Enter duration (e.g., 7 days)
3. Vendor appears in featured sections
4. Auto-unfeatured after duration expires

### Send Bulk Notification
1. Click "Bulk Notify" in Vendors section
2. Enter title and message
3. Select severity (Info/Warning/Urgent)
4. All vendors receive notification instantly

### Resolve a Dispute
1. Navigate to Controls → Disputes
2. Click "Review" to mark under investigation
3. Add resolution notes
4. Click "Resolve" to close the dispute
5. Both parties receive notification

## 🎯 Best Practices

1. **Always provide reasons** when suspending vendors or deleting reviews
2. **Use appropriate severity levels** for notifications
3. **Resolve disputes promptly** to maintain marketplace trust
4. **Review the activity log** regularly for oversight
5. **Feature high-performing vendors** to boost marketplace quality

## 🔍 Monitoring & Maintenance

### Activity Log
Check `admin_activity_log` table regularly to:
- Monitor admin actions
- Identify suspicious patterns
- Generate compliance reports
- Track policy enforcement

### Performance Metrics
Monitor these key indicators:
- Average dispute resolution time
- Vendor suspension/activation ratio
- Review moderation queue length
- Featured vendor conversion rates

## 🆘 Troubleshooting

### "Error loading admin control data"
- Verify admin authentication is active
- Check Supabase connection
- Ensure RLS policies are correctly set

### "Failed to suspend vendor"
- Verify vendor_id exists in vendor_management table
- Check admin has proper permissions
- Review Supabase logs for errors

### Notifications not sending
- Ensure vendor_id is valid
- Check vendor_notifications table for inserts
- Verify email notifications are configured (optional)

## 📚 Related Documentation

- `app/utils/adminStatsSchema.sql` - Analytics schema
- `app/contexts/AdminAuthContext.tsx` - Admin authentication
- `app/contexts/AdminStatsContext.tsx` - Platform analytics
- `app/components/AdminAnalyticsDashboard.tsx` - Analytics UI

## ✅ Testing Checklist

- [ ] Run database schema successfully
- [ ] Admin can access Controls tab
- [ ] Suspend/activate vendor works
- [ ] Feature vendor for specific duration works
- [ ] Send individual notification works
- [ ] Send bulk notification works
- [ ] Delete review with reason works
- [ ] Approve reported review works
- [ ] Create and resolve dispute works
- [ ] Activity log records all actions
- [ ] UI responsive on mobile, tablet, web
- [ ] RLS policies block unauthorized access

## 🎉 Success!

Your Admin Control Panel is now fully operational. You can:
- ✅ Manage vendors with suspend/activate/feature controls
- ✅ Moderate reviews and handle reports
- ✅ Resolve customer-vendor disputes
- ✅ Send targeted or bulk notifications
- ✅ Track all admin actions in audit log
- ✅ Maintain marketplace quality and trust

For questions or enhancements, refer to the context files or update the `AdminControlsContext.tsx` with additional functionality.
