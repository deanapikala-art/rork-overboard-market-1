# Trust Score System — Setup Guide

## Overview

The **Trust Score & Recovery System** rewards vendors for good standing and provides clear pathways to rebuild reputation after score drops. This creates a positive feedback loop that encourages policy compliance, order fulfillment, and customer satisfaction.

---

## ✅ What's Been Implemented

### 1. Database Schema (`app/utils/trustScoreSchema.sql`)
- Trust score fields on `vendor_profiles` table
- `trust_score_history` table for tracking changes over time
- `trust_recovery_goals` table for detailed recovery tracking
- `trust_admin_actions` table for admin audit log
- PostgreSQL functions:
  - `calculate_trust_score()` — Computes weighted score
  - `determine_trust_tier()` — Assigns tier based on score
  - `update_vendor_trust_score()` — Updates and logs score changes
  - `initiate_trust_recovery()` — Starts recovery program

### 2. Context Provider (`app/contexts/TrustScoreContext.tsx`)
- `useTrustScore()` hook for accessing trust data
- Methods:
  - `fetchTrustData()` — Load vendor trust information
  - `calculateBreakdown()` — Show score component breakdown
  - `generateRecoveryGoals()` — Create personalized recovery plan
  - `updateRecoveryGoalProgress()` — Track goal completion
  - `completeRecovery()` — Mark recovery as finished
  - `requestVerification()` — Submit verification request

### 3. Vendor Dashboard (`app/components/VendorTrustDashboard.tsx`)
- Trust score display with tier badge
- Score breakdown by category
- Recovery program panel with:
  - Progress bar
  - Goal tracking
  - Completion milestones
- Request verification button
- Success celebration on recovery completion

### 4. Customer-Facing Badge (`app/components/TrustedVendorBadge.tsx`)
- Color-coded tier badges
- Tooltip with trust information
- `VendorTrustInfo` component for detailed stats
- Used on product listings and vendor profiles

### 5. Admin Management (`app/components/AdminTrustManagement.tsx`)
- Overview dashboard with statistics
- Vendor trust leaderboard
- Search and filter tools
- Admin actions:
  - Recalculate trust scores
  - Grant/revoke verification
  - Add warnings
  - View recovery status

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Execute the SQL schema in your Supabase SQL editor:

```bash
# Copy the contents of app/utils/trustScoreSchema.sql
# Paste into Supabase SQL Editor
# Run the migration
```

This will:
- Add trust score columns to `vendor_profiles`
- Create history and tracking tables
- Set up calculation functions
- Enable Row Level Security policies

### Step 2: Wrap Your App with TrustScoreContext

**For Vendors only**, add the context provider:

```tsx
// In app/_layout.tsx or your vendor-specific layout
import { TrustScoreContext } from './contexts/TrustScoreContext';

export default function VendorLayout() {
  return (
    <TrustScoreContext>
      <YourVendorApp />
    </TrustScoreContext>
  );
}
```

### Step 3: Add Trust Dashboard to Vendor Dashboard

```tsx
// In your vendor dashboard page
import VendorTrustDashboard from '@/app/components/VendorTrustDashboard';

export default function VendorDashboardPage() {
  return (
    <ScrollView>
      {/* Other dashboard components */}
      <VendorTrustDashboard />
    </ScrollView>
  );
}
```

### Step 4: Display Trust Badges on Product Listings

```tsx
// In your product card or vendor profile
import TrustedVendorBadge from '@/app/components/TrustedVendorBadge';

<TrustedVendorBadge
  trustScore={vendor.trustScore}
  trustTier={vendor.trustTier}
  verifiedVendor={vendor.verifiedVendor}
  compact={true}
/>
```

### Step 5: Add Admin Trust Management

```tsx
// In your admin panel
import AdminTrustManagement from '@/app/components/AdminTrustManagement';

export default function AdminTrustPage() {
  return <AdminTrustManagement />;
}
```

### Step 6: Schedule Automated Score Updates

Set up a daily cron job or Edge Function to recalculate scores:

```sql
-- Run this daily via scheduled job
SELECT update_vendor_trust_score(id) 
FROM vendor_profiles 
WHERE trust_score IS NOT NULL;
```

You can use Supabase Edge Functions or external cron services like GitHub Actions.

---

## 🧮 Trust Score Calculation

### Weighted Components (Total: 100 points)

| Component            | Weight | Formula                               |
| -------------------- | ------ | ------------------------------------- |
| Order Fulfillment    | 35%    | `(fulfilled / total) × 35`            |
| Average Reviews      | 25%    | Fixed 25 if positive reviews exist    |
| Dispute-Free Ratio   | 15%    | `(1 - disputes/total) × 15`           |
| Policy Compliance    | 15%    | 15 if all policies acknowledged       |
| Warning Penalty      | 10%    | `10 - (warnings × 2)` (min 0)         |

### Trust Tiers

| Score Range | Tier                  | Badge Color | Benefits                          |
| ----------- | --------------------- | ----------- | --------------------------------- |
| 90-100      | Trusted Vendor        | Teal        | Featured listings, verification   |
| 75-89       | Verified & Reliable   | Green       | Standard visibility               |
| 50-74       | New or Improving      | Orange      | Normal visibility                 |
| < 50        | Under Review          | Red         | Hidden from search                |

---

## 🔄 Recovery System Flow

### Trigger
When `trust_score` drops below **75**:
1. System sets `trust_recovery_active = true`
2. Captures drop reason
3. Auto-generates 3-5 recovery goals

### Recovery Goals (Examples)
- Complete 5 on-time orders
- Resolve all open disputes
- Maintain 30 days dispute-free
- Get 3 new 4★+ reviews
- Acknowledge all active policies

### Completion
When all goals are met:
1. Vendor marks recovery complete
2. System recalculates trust score
3. If score ≥ 75, recovery ends
4. Success message displayed

---

## 🎨 Design Customization

### Colors
Current theme uses Overboard Market brand colors:
- **Teal** (#4C7D7C) — Trusted
- **Green** (#10B981) — Verified
- **Orange** (#F59E0B) — New/Improving
- **Red** (#EE6E56) — Under Review

To customize, update `getTierColor()` in components.

### Icons
Using lucide-react-native icons:
- Award — Trusted Vendor
- CheckCircle — Verified
- Clock — New
- AlertCircle — Under Review
- Shield — Trust System

---

## 📊 Admin Features

### Trust Leaderboard
View all vendors sorted by trust score with:
- Real-time statistics
- Filter by tier or recovery status
- Search by shop name

### Actions
- **Recalculate** — Force immediate score update
- **Verify** — Grant verified vendor badge
- **Add Warning** — Increase warning count, affects score
- **View History** — See score changes over time (via SQL)

### Notifications
Set up admin alerts for:
- Vendor score drops below threshold
- Verification requests
- Recovery program completions

---

## 🔔 Future Enhancements

Consider adding:
1. **Email notifications** when vendors enter recovery
2. **Badge rewards** for consistent high performance
3. **Public trust leaderboard** for customers
4. **Review response tracking** as score component
5. **Automated dispute detection** from order issues
6. **Trust score API** for third-party integrations

---

## 🧪 Testing Checklist

### Vendor Side
- [ ] View trust dashboard
- [ ] See score breakdown
- [ ] Generate recovery plan
- [ ] Track recovery progress
- [ ] Request verification
- [ ] View badges on own profile

### Customer Side
- [ ] See trust badges on listings
- [ ] View vendor trust info
- [ ] Filter by "Trusted Vendors"

### Admin Side
- [ ] View trust leaderboard
- [ ] Filter and search vendors
- [ ] Recalculate scores
- [ ] Grant/revoke verification
- [ ] Add warnings
- [ ] Track recovery vendors

---

## 📝 Notes

- Trust scores default to **70** for new vendors
- Scores update automatically daily (requires cron setup)
- Verification is manual approval by admins
- Recovery goals are customizable per vendor situation
- All admin actions are logged in `trust_admin_actions` table

---

## 🆘 Support

For issues or questions:
- Check Supabase logs for function errors
- Verify RLS policies are enabled
- Ensure vendor_profiles has required columns
- Test with SQL directly before using UI

---

**System Status:** ✅ Complete and ready for deployment
**Last Updated:** November 9, 2025
