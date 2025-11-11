# Policy Update Notification & Re-Acknowledgment System - Implementation Guide

## Overview

The Policy Update Notification & Re-Acknowledgment System for Overboard Market automatically notifies users when policies change and tracks acknowledgment status. This system ensures compliance and provides audit trails for policy acceptance.

---

## System Components

### 1. Database Schema (`app/utils/policyAcknowledgmentSchema.sql`)

**Tables:**
- `policy_texts` - Stores versioned policy content
- `user_policy_acknowledgments` - Tracks user acknowledgments
- `policy_update_notifications` - Manages pending notifications
- `policy_acknowledgment_stats` - Summary stats for admin tracking

**Key Functions:**
- `get_current_policy_version(policy_type)` - Returns latest policy version
- `user_needs_policy_acknowledgment(user_id, policy_type)` - Checks if user needs to acknowledge
- `notify_policy_update(policy_type, new_version)` - Creates notifications for all users

### 2. Context Provider (`app/contexts/PolicyAcknowledgmentContext.tsx`)

**Provides:**
- `currentPolicies` - Active policy versions
- `userAcknowledgments` - User's acknowledgment history
- `pendingNotifications` - Unacknowledged policy updates
- `needsAcknowledgment(policyType)` - Check if user needs to acknowledge
- `acknowledgPolicy(policyType, version)` - Record acknowledgment
- `hasPendingPolicies` - Boolean for any pending acknowledgments

**Features:**
- Real-time updates via Supabase subscriptions
- Automatic loading on auth state change
- Tracks version mismatches

### 3. Banner Component (`app/components/PolicyBanner.tsx`)

**Components:**
- `PolicyBanner` - Single policy notification banner
- `GlobalPolicyBanner` - Auto-displays first pending policy

**Features:**
- Dismissible notifications
- Direct link to policy center with acknowledgment UI
- Teal-themed design matching Overboard Market style

### 4. Admin Tracker (`app/components/AdminAcknowledgmentTracker.tsx`)

**Features:**
- Real-time acknowledgment stats by policy type
- Progress bars showing completion percentage
- Manual recalculate function
- Export-ready data view

**Displays:**
- Total users
- Acknowledged count
- Pending count
- Last update timestamp

### 5. Updated Policy Center (`app/legal/policy-center.tsx`)

**New Features:**
- Query parameter support (`?tab=privacy&requireAck=true`)
- Accept & Continue button
- Decline / Log Out button
- Version comparison display
- Acknowledgment confirmation alerts

---

## Setup Instructions

### Step 1: Run Database Schema

```bash
# Copy the SQL to your Supabase SQL Editor and run
cat app/utils/policyAcknowledgmentSchema.sql
```

This creates all necessary tables, indexes, RLS policies, and functions.

### Step 2: Wrap App with PolicyAcknowledgmentProvider

Edit `app/_layout.tsx`:

```typescript
import { PolicyAcknowledgmentProvider } from './contexts/PolicyAcknowledgmentContext';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PolicyAcknowledgmentProvider>
        {/* Other providers */}
        <RootLayoutNav />
      </PolicyAcknowledgmentProvider>
    </QueryClientProvider>
  );
}
```

### Step 3: Add GlobalPolicyBanner to Root Layout

Add the banner after authentication check:

```typescript
import { GlobalPolicyBanner } from './components/PolicyBanner';

function RootLayoutNav() {
  return (
    <>
      <GlobalPolicyBanner />
      <Stack>
        {/* Your routes */}
      </Stack>
    </>
  );
}
```

### Step 4: Add Admin Tracker to Admin Dashboard

In `app/(tabs)/admin.tsx`:

```typescript
import { AdminAcknowledgmentTracker } from '../components/AdminAcknowledgmentTracker';

// Add a new tab or section
<TouchableOpacity onPress={() => setView('policy-tracker')}>
  <Text>Policy Acknowledgments</Text>
</TouchableOpacity>

{view === 'policy-tracker' && <AdminAcknowledgmentTracker />}
```

---

## Usage Workflows

### Admin: Publishing a Policy Update

1. **Update Policy Content** in database:
```sql
INSERT INTO policy_texts (policy_type, version, title, content, requires_acknowledgment)
VALUES ('privacy', 1.1, 'Privacy Policy', '{"sections": [...]}', true);
```

2. **Mark New Version as Active**:
```sql
UPDATE policy_texts SET is_active = false WHERE policy_type = 'privacy' AND version < 1.1;
UPDATE policy_texts SET is_active = true WHERE policy_type = 'privacy' AND version = 1.1;
```

3. **Trigger Notifications**:
```sql
SELECT notify_policy_update('privacy', 1.1);
```

This automatically creates notifications for all users who haven't acknowledged v1.1.

### User: Acknowledging Policy

1. User sees banner at top of app
2. Clicks "Review Now"
3. Reads policy in Policy Center
4. Clicks "Accept & Continue"
5. Banner disappears
6. Record saved to `user_policy_acknowledgments`

### Admin: Monitoring Acknowledgments

1. Open Admin Dashboard
2. Navigate to "Policy Acknowledgments"
3. View stats for each policy type
4. See progress bars and counts
5. Click "Recalculate" to refresh stats

---

## Policy Types

- `privacy` → Privacy Policy
- `terms` → Terms of Use
- `codeOfConduct` → Community Code of Conduct

---

## Data Model Examples

### PolicyText
```typescript
{
  id: "uuid",
  policy_type: "privacy",
  version: 1.2,
  title: "Privacy Policy",
  content: {...},
  requires_acknowledgment: true,
  is_active: true,
  last_updated: "2025-11-09T12:00:00Z"
}
```

### UserPolicyAcknowledgment
```typescript
{
  id: "uuid",
  user_id: "user-uuid",
  policy_type: "terms",
  acknowledged_version: 1.1,
  acknowledged_at: "2025-11-09T14:30:00Z"
}
```

### PolicyUpdateNotification
```typescript
{
  id: "uuid",
  user_id: "user-uuid",
  policy_type: "codeOfConduct",
  old_version: 1.0,
  new_version: 1.1,
  title: "We've updated our Community Code of Conduct",
  message: "Please review...",
  is_acknowledged: false
}
```

---

## Customization Options

### Change Banner Style
Edit `app/components/PolicyBanner.tsx` styles section to match your theme.

### Add Email Notifications
Extend `notify_policy_update()` function to call your email service:

```sql
-- Add to notify_policy_update function
PERFORM send_email(
  user_record.email,
  'Policy Update',
  'We have updated our ' || policy_title
);
```

### Add Push Notifications
Integrate with Expo Notifications in the context:

```typescript
import * as Notifications from 'expo-notifications';

// In PolicyAcknowledgmentContext
useEffect(() => {
  if (hasPendingPolicies) {
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Policy Update Required',
        body: 'Please review and accept updated policies.',
      },
      trigger: null,
    });
  }
}, [hasPendingPolicies]);
```

---

## Testing Checklist

- [ ] Database schema runs without errors
- [ ] PolicyAcknowledgmentContext loads policies
- [ ] Banner appears when policy needs acknowledgment
- [ ] Banner dismisses temporarily on "Later"
- [ ] Policy Center opens with correct tab
- [ ] Accept button records acknowledgment
- [ ] Decline button logs user out
- [ ] Admin tracker displays stats
- [ ] Real-time updates work (test with 2 browser windows)
- [ ] Recalculate button refreshes stats

---

## Security & Privacy

- RLS policies ensure users only see their own acknowledgments
- Admins have full read access for compliance tracking
- IP address and user agent are logged for audit trails
- All data encrypted at rest and in transit via Supabase

---

## Performance Optimization

- Indexed queries on `user_id`, `policy_type`, and `is_acknowledged`
- Stats table pre-computed to avoid expensive JOINs
- Real-time subscriptions filter by user_id
- Pagination recommended if notification count > 100

---

## Troubleshooting

**Banner doesn't appear:**
- Check if user has acknowledged current version
- Verify `requires_acknowledgment` is `true` in policy_texts
- Check browser console for context errors

**Admin tracker shows 0:**
- Run `SELECT * FROM policy_acknowledgment_stats;`
- If empty, click "Recalculate" button
- Verify admin RLS policies are correct

**Acknowledgment doesn't save:**
- Check user authentication status
- Verify RLS policies allow INSERT
- Check Supabase logs for constraint violations

---

## Future Enhancements

- [ ] Email notification templates
- [ ] Push notification integration
- [ ] Downloadable policy PDFs
- [ ] Multi-language policy support
- [ ] Automated version increment UI
- [ ] Policy diff/comparison view
- [ ] Scheduled policy releases
- [ ] User acknowledgment history timeline

---

## Support

For issues or questions about this system:
- Check Supabase logs for database errors
- Review browser console for client-side errors
- Verify RLS policies with `SELECT * FROM pg_policies WHERE tablename = 'policy_texts';`

---

**System Status:** ✅ Production Ready  
**Last Updated:** November 2025  
**Maintainer:** Overboard Market Development Team
