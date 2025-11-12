# 🚀 Policy Update Templates — Quick Start Guide

## ⚡ Getting Started in 5 Minutes

This guide shows you how to integrate the **Policy Update Templates System** into your Overboard Market admin panel.

---

## 📋 Prerequisites

Make sure you have:
- ✅ PolicyAcknowledgmentContext set up and working
- ✅ Policy Center page (`/legal/policy-center`)
- ✅ Database tables created (see `app/utils/policyAcknowledgmentSchema.sql`)
- ✅ Admin authentication working

---

## 🎯 Step 1: Add Policy Templates to Your Project

The templates are already created in:
```
constants/policyTemplates.ts
```

This file contains all the branded messaging, email templates, and helper functions.

---

## 🎯 Step 2: Display Policy Banners to Users

Add the `GlobalPolicyBanner` component to your app layout:

**File: `app/_layout.tsx`**
```typescript
import { PolicyAcknowledgmentProvider } from '@app/contexts/PolicyAcknowledgmentContext';
import { GlobalPolicyBanner } from '@/components/PolicyBanner';

export default function RootLayout() {
  return (
    <PolicyAcknowledgmentProvider>
      <GlobalPolicyBanner />
      {/* Rest of your app */}
    </PolicyAcknowledgmentProvider>
  );
}
```

**What this does:**
- Shows a persistent banner when users have unacknowledged policy updates
- Automatically uses branded templates for messaging
- Links users to the Policy Center for review
- Dismissible with "Later" button

---

## 🎯 Step 3: Add Admin Policy Management

### Option A: Use the Complete Management Screen

Navigate to the pre-built screen:
```typescript
// In your admin navigation
<Link href="/admin-policy-management">Policy Management</Link>
```

**What you get:**
- List of all policies with current versions
- Editor for creating new policy versions
- Statistics dashboard for tracking acknowledgments
- All in one integrated screen

### Option B: Use Individual Components

If you want more control, use components separately:

**Admin Dashboard:**
```typescript
import { AdminAcknowledgmentStats } from '@/components/AdminAcknowledgmentStats';

export default function AdminDashboard() {
  return (
    <View>
      <Text>Admin Dashboard</Text>
      <AdminAcknowledgmentStats />
    </View>
  );
}
```

**Policy Editor:**
```typescript
import { AdminPolicyEditor } from '@/components/AdminPolicyEditor';

export default function PolicyEditorScreen() {
  return (
    <AdminPolicyEditor
      policyType="terms"
      currentVersion={1.2}
      onSave={() => {
        console.log('Policy saved!');
        // Refresh policy list or navigate back
      }}
    />
  );
}
```

---

## 🎯 Step 4: Publish Your First Policy Update

1. **Navigate to Admin Policy Management**
   ```
   /admin-policy-management
   ```

2. **Select a policy type** (e.g., "Terms of Use")

3. **Fill in the editor:**
   - **Title**: e.g., "Terms of Use v1.3"
   - **Content**: Write your policy in Markdown
   - **Require Acknowledgment**: Toggle ON
   - **Send Notifications**: Toggle ON

4. **Preview the notification:**
   - See banner text
   - See email subject line
   - Review summary points

5. **Click "Publish"**
   - Confirms with dialog
   - Deactivates old version
   - Creates notifications for ALL users
   - Users immediately see banner

---

## 📊 Step 5: Monitor Acknowledgments

1. **Navigate to Statistics Dashboard**
   ```
   /admin-policy-management → "View Acknowledgment Statistics"
   ```

2. **See real-time data:**
   - Total users
   - Acknowledged count
   - Pending count
   - Progress percentage
   - Last updated date

3. **Send reminders** (optional):
   - Click "Send Reminder" button
   - Emails pending users

---

## 🎨 Customizing Templates

### Change Banner Colors

Edit `constants/policyTemplates.ts`:
```typescript
export const OVERBOARD_COLORS = {
  primary: '#YOUR_PRIMARY_COLOR',    // Banner background
  text: '#YOUR_TEXT_COLOR',          // Text color
  accent: '#YOUR_ACCENT_COLOR',      // Button color
  white: '#FFFFFF',
};
```

### Modify Banner Text

Update templates in `constants/policyTemplates.ts`:
```typescript
export const POLICY_TEMPLATES: Record<PolicyType, PolicyTemplate> = {
  terms: {
    bannerMessage: "YOUR CUSTOM MESSAGE HERE",
    emailSubject: (version) => `YOUR CUSTOM SUBJECT (v${version})`,
    // ...
  },
  // ...
};
```

### Add New Policy Types

1. **Extend PolicyType enum:**
```typescript
// In PolicyAcknowledgmentContext.tsx
export type PolicyType = 'privacy' | 'terms' | 'codeOfConduct' | 'trustSafety';
```

2. **Add template:**
```typescript
// In policyTemplates.ts
export const POLICY_TEMPLATES: Record<PolicyType, PolicyTemplate> = {
  // existing templates...
  trustSafety: {
    type: 'trustSafety',
    icon: '🛡️',
    title: 'Trust & Safety Policy',
    bannerTitle: (version) => `Trust & Safety Policy Updated (v${version})`,
    bannerMessage: "We've enhanced our safety measures...",
    // ...
  },
};
```

---

## 🔧 Troubleshooting

### Banner Not Showing

**Check:**
1. Is PolicyAcknowledgmentProvider wrapping your app?
2. Is there an active policy with `requires_acknowledgment = true`?
3. Has the user already acknowledged the current version?
4. Check console logs for errors

**Debug:**
```typescript
const { hasPendingPolicies, pendingNotifications } = usePolicyAcknowledgment();
console.log('Has pending:', hasPendingPolicies);
console.log('Notifications:', pendingNotifications);
```

### Notifications Not Created

**Check:**
1. Did you toggle "Send Notifications" ON?
2. Did you toggle "Require Acknowledgment" ON?
3. Are there users in your database?
4. Check Supabase logs for errors

**Verify:**
```sql
-- Check if notifications were created
SELECT * FROM policy_update_notifications 
WHERE policy_type = 'terms' 
ORDER BY created_at DESC;
```

### Stats Not Loading

**Check:**
1. Is admin authenticated?
2. Are there active policies?
3. Check Supabase RLS policies

**Debug:**
```typescript
// In AdminAcknowledgmentStats component
console.log('Loading stats...');
// Check console for error messages
```

---

## 📚 API Reference

### Helper Functions

**`getPolicyIcon(policyType: PolicyType): string`**
- Returns emoji icon for policy
- Example: `getPolicyIcon('terms')` → "📜"

**`getPolicyTitle(policyType: PolicyType): string`**
- Returns human-readable title
- Example: `getPolicyTitle('privacy')` → "Privacy Policy"

**`getPolicyBannerTitle(policyType: PolicyType, version: number): string`**
- Returns formatted banner title with version
- Example: `getPolicyBannerTitle('terms', 1.3)` → "Terms of Use Updated (v1.3)"

**`getPolicyBannerMessage(policyType: PolicyType): string`**
- Returns banner message text
- Example: `getPolicyBannerMessage('privacy')` → "We've improved transparency..."

**`generateNotificationPayload(...)`**
- Creates notification object for database insert
- Returns: `{ title, message, link, policyType, oldVersion, newVersion }`

**`generatePolicyEmail(...)`**
- Creates complete email template object
- Returns: `{ subject, greeting, intro, summaryPoints, ... }`

---

## 🎯 Next Steps

1. **Test the workflow:**
   - Publish a policy update
   - Check that banners appear
   - Verify acknowledgment flow
   - Monitor statistics

2. **Integrate email:**
   - Connect to SendGrid or similar
   - Use `generatePolicyEmail()` for content
   - Send on policy publish

3. **Add reminders:**
   - Implement reminder emails for pending users
   - Schedule weekly reminders
   - Track reminder history

4. **Customize styling:**
   - Match your brand colors
   - Adjust banner positioning
   - Customize email templates

---

## ✅ Checklist

- [ ] PolicyAcknowledgmentProvider added to app layout
- [ ] GlobalPolicyBanner displayed in app
- [ ] Admin Policy Management screen accessible
- [ ] Database tables created and RLS policies set
- [ ] Tested publishing a policy update
- [ ] Verified banner appears to users
- [ ] Tested acknowledgment flow
- [ ] Reviewed statistics dashboard
- [ ] Customized templates (optional)
- [ ] Integrated email service (optional)

---

## 💡 Tips

- **Start with one policy**: Test with Terms of Use before rolling out to all policies
- **Use draft mode**: Save drafts before publishing to test content
- **Monitor statistics**: Check acknowledgment rates to ensure users are seeing banners
- **Communicate changes**: Consider sending an announcement before major policy changes
- **Keep versions small**: Increment by 0.1 for minor updates, 1.0 for major changes

---

## 🆘 Need Help?

**Common Issues:**
- Banner not showing → Check provider setup and pending notifications
- Stats not loading → Verify admin auth and database access
- Notifications not creating → Check toggles and database logs

**Resources:**
- Full Documentation: `/POLICY_UPDATE_TEMPLATES_COMPLETE.md`
- Database Schema: `/app/utils/policyAcknowledgmentSchema.sql`
- Integration Guide: `/POLICY_ACKNOWLEDGMENT_SYSTEM_GUIDE.md`

---

**You're all set!** 🎉

Your policy update system is ready to keep users informed and compliant with the latest terms, privacy policies, and community guidelines.
