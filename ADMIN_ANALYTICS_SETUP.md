# Global Admin Analytics Dashboard - Setup Guide

## Overview

The Global Admin Analytics Dashboard provides real-time, platform-wide visibility into Overboard Market's performance, vendor activity, and customer engagement.

---

## Features Implemented

### 📊 Core Analytics Metrics
- **Total Platform Revenue**: Sum of all confirmed orders
- **Total Orders**: Count of all completed orders
- **Average Order Value**: Revenue per order
- **Active Vendors**: Vendors with orders in the last 30 days
- **Active Shoppers**: Unique buyers in the last 30 days
- **Fulfillment Rate**: Percentage of orders delivered
- **Average Delivery Time**: Days from shipped to delivered
- **7-Day Sales Growth**: Week-over-week revenue comparison

### 📈 Visualizations
- **Summary Cards**: Key metrics at a glance
- **Top Vendors Leaderboard**: Ranked by revenue and order count
- **Sales by Category**: Progress bars showing category performance
- **Customer Satisfaction**: Average rating and review count
- **Activity Metrics**: Vendor and shopper engagement stats

### 🔄 Real-Time Updates
- Auto-refresh capability
- Database triggers for automatic stat calculations
- Manual refresh button

---

## Database Setup

### Step 1: Run the SQL Schema

Execute the SQL file to create the necessary database structure:

```bash
# Connect to your Supabase database and run:
app/utils/adminStatsSchema.sql
```

This creates:
- `admin_stats` table for storing aggregated statistics
- `refresh_admin_stats()` function for calculating metrics
- Automatic triggers to update stats when orders change

### Step 2: Verify Tables

Check that these tables exist in your Supabase database:
- ✅ `admin_stats` - Analytics storage
- ✅ `user_orders` - Order records (should already exist)
- ✅ `admin_users` - Admin authentication (should already exist)

---

## Access the Dashboard

### For Admins:

1. **Sign in as Admin**
   - Navigate to the Admin tab in your app
   - If not authenticated, you'll be redirected to `/admin-auth`

2. **Navigate to Analytics**
   - Click the "Analytics" tab in the admin panel
   - You'll see real-time platform statistics

3. **Refresh Data**
   - Click the refresh icon in the top-right corner
   - Stats automatically update when orders are created/modified

---

## How Stats Are Calculated

### Automatic Updates

Stats refresh automatically when:
- A new order is created
- An order status changes
- Shipping information is added
- An order is marked as delivered

### Manual Refresh

You can manually trigger a refresh:
- Click the refresh icon in the dashboard
- Calls the `refresh_admin_stats()` database function
- Recalculates all metrics from scratch

### Metric Calculations

| Metric | Calculation |
|--------|------------|
| Total Revenue | Sum of all confirmed order totals |
| Total Orders | Count of orders where `confirmed_by_vendor = true` |
| Avg Order Value | Total Revenue ÷ Total Orders |
| Active Vendors | Distinct vendors with orders in last 30 days |
| Active Shoppers | Distinct customers with orders in last 30 days |
| Fulfillment Rate | (Delivered Orders ÷ Shipped Orders) × 100 |
| Avg Delivery Time | Average days between `shipped_at` and `delivered_at` |
| 7-Day Growth | ((Current Week Revenue - Previous Week Revenue) ÷ Previous Week Revenue) × 100 |

---

## API Reference

### Context Hook: `useAdminStats()`

```typescript
import { useAdminStats } from '@/app/contexts/AdminStatsContext';

const {
  stats,                      // AdminStats | null
  isLoading,                  // boolean
  refreshStats,               // () => Promise<void>
  getVendorStats,            // (vendorId: string) => Promise<VendorStats | null>
  getTopVendorsByRevenue,    // (limit?: number) => TopVendor[]
  getTopVendorsByOrders,     // (limit?: number) => TopVendor[]
  getSalesGrowth,            // () => { current, previous, growth }
} = useAdminStats();
```

### Example Usage

```typescript
// Get top 10 vendors by revenue
const topVendors = getTopVendorsByRevenue(10);

// Get individual vendor stats
const vendorStats = await getVendorStats('vendor-id-123');

// Calculate sales growth
const growth = getSalesGrowth();
console.log(`Revenue grew by ${growth.growth}%`);
```

---

## Troubleshooting

### Stats Not Loading

1. **Check Database Connection**
   - Go to Dashboard tab → "Test Database Connection"
   - Verify Supabase credentials in your `.env`

2. **Verify Table Exists**
   ```sql
   SELECT * FROM admin_stats LIMIT 1;
   ```

3. **Run Manual Refresh**
   ```sql
   SELECT refresh_admin_stats();
   ```

### Stats Not Updating

1. **Check Trigger Status**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'user_orders_stats_refresh';
   ```

2. **Manually Trigger Update**
   - Click the refresh icon in the Analytics dashboard
   - Or run: `SELECT refresh_admin_stats();` in your database

### Permission Errors

1. **Verify Admin Access**
   ```sql
   SELECT * FROM admin_users WHERE email = 'your-email@example.com';
   ```

2. **Check RLS Policies**
   - Ensure `admin_stats` table has proper RLS policies
   - Admins should have SELECT access

---

## Future Enhancements

### Planned Features

- 📅 **Date Range Filters**: View analytics for specific time periods
- 📤 **CSV/PDF Export**: Download reports for offline analysis
- 🔔 **Alert System**: Notifications for significant metric changes
- 📍 **Geographic Insights**: Top regions by sales and customer density
- 📊 **Charts & Graphs**: Interactive visualizations with charting library
- 🎯 **Custom Dashboards**: Configurable metric displays
- 🔍 **Vendor Deep Dive**: Click vendor names for detailed analytics
- ⚠️ **At-Risk Vendors**: Identify vendors with declining performance

### Integration Opportunities

- **Email Reports**: Weekly/monthly summaries sent to admins
- **Webhooks**: Real-time notifications for key events
- **Third-Party Analytics**: Integration with Google Analytics, Mixpanel
- **Mobile Notifications**: Push alerts for important metrics

---

## Data Privacy & Security

### Access Control
- Only users in the `admin_users` table can access analytics
- Authentication checked on every request
- Context-level permission validation

### Data Aggregation
- Stats are aggregated, not individual order details
- Personal customer information not exposed
- Vendor-specific stats available via dedicated endpoint

### Performance
- Stats calculated asynchronously via triggers
- No performance impact on order operations
- Optimized queries with proper indexing

---

## Support

For questions or issues:
1. Check console logs for detailed error messages
2. Verify database schema is up to date
3. Test database connection via Admin Dashboard
4. Review this guide for common solutions

---

## Summary

✅ **AdminStatsContext** - Provides analytics data throughout the app  
✅ **AdminAnalyticsDashboard** - Beautiful, responsive UI component  
✅ **Database Schema** - Automated stat calculations with triggers  
✅ **Real-Time Updates** - Stats refresh automatically  
✅ **Manual Refresh** - On-demand stat recalculation  
✅ **Secure Access** - Admin-only authentication  
✅ **Responsive Design** - Works on mobile, tablet, and web  

Your Global Admin Analytics Dashboard is ready to use! 🎉
