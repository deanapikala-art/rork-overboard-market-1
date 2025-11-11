# Customer Notification System Setup Guide

## Overview
The Customer Notification System provides real-time alerts to shoppers about orders, shipping, messages, and vendor updates. It completes the 3-way communication loop: **Admin ↔ Vendor ↔ Customer**.

---

## ✅ What's Been Implemented

### 1. **Database Schema** (`app/utils/customerNotificationsSchema.sql`)
- **customer_notifications** table - stores all customer notifications
- **customer_notification_preferences** table - stores user preferences
- Notification types: OrderPlaced, OrderConfirmed, OrderShipped, OrderDelivered, VendorMessage, ShippingUpdate, etc.
- Real-time subscriptions via Row Level Security (RLS)
- Auto-archiving of 60+ day old notifications

### 2. **Context Provider** (`app/contexts/CustomerNotificationsContext.tsx`)
- Manages notification state and real-time updates
- Methods:
  - `markAsRead(notificationId)` - mark single notification as read
  - `markAllAsRead()` - mark all notifications as read
  - `deleteNotification(notificationId)` - remove notification
  - `updatePreferences()` - update user notification settings
  - `createNotification()` - manually create notifications (for testing/integration)
- Real-time Supabase subscriptions for instant updates

### 3. **Notification Bell Component** (`app/components/CustomerNotificationBell.tsx`)
- Bell icon with unread badge
- Dropdown modal showing recent notifications
- Click notification to navigate to related order
- Swipe-to-delete and "Mark all read" functionality
- Time-relative timestamps (e.g., "5m ago", "2h ago")

### 4. **Preferences Modal** (`app/components/CustomerNotificationPreferencesModal.tsx`)
- Delivery method toggles (In-App, Email, Push)
- Notification type toggles (orders, shipping, messages, etc.)
- "Mute Non-Critical" option
- Beautiful, user-friendly UI with icons and descriptions

### 5. **UI Integration**
- Notification bell added to Profile screen top bar
- "Notification Settings" button in profile menu
- Providers properly nested in `app/_layout.tsx`

---

## 🔧 Next Steps - Integration

### Step 1: Run the Database Schema
Execute the SQL file in your Supabase dashboard:
```bash
# In Supabase SQL Editor, run:
app/utils/customerNotificationsSchema.sql
```

### Step 2: Trigger Notifications from Order Events

You need to integrate notification creation into your existing order and messaging flows.

#### **Example: Create notification when order is placed**
```typescript
// In app/contexts/OrdersContext.tsx or wherever orders are created

import { useCustomerNotifications } from '@/app/contexts/CustomerNotificationsContext';

const { createNotification } = useCustomerNotifications();

// When order is placed:
await createNotification(
  'OrderPlaced',
  'Order Placed Successfully',
  `Your order from ${vendorName} has been placed. Total: $${total}`,
  {
    relatedOrder: orderId,
    relatedVendor: vendorId,
    severity: 'success',
  }
);
```

#### **Example: Notify when vendor confirms payment**
```typescript
// When vendor confirms order (vendor dashboard or backend):
await supabase
  .from('customer_notifications')
  .insert({
    customer_id: customerId,
    type: 'OrderConfirmed',
    title: 'Payment Confirmed',
    message: `${vendorName} has confirmed your payment. Your order is being prepared.`,
    related_order: orderId,
    related_vendor: vendorId,
    severity: 'success',
  });
```

#### **Example: Notify when order ships**
```typescript
// When vendor adds shipping info:
await supabase
  .from('customer_notifications')
  .insert({
    customer_id: customerId,
    type: 'OrderShipped',
    title: 'Order Shipped!',
    message: `Your order from ${vendorName} has shipped via ${shippingProvider}. Tracking: ${trackingNumber}`,
    related_order: orderId,
    related_vendor: vendorId,
    severity: 'info',
  });
```

#### **Example: Notify when delivered**
```typescript
// When delivery is confirmed (auto or manual):
await supabase
  .from('customer_notifications')
  .insert({
    customer_id: customerId,
    type: 'OrderDelivered',
    title: 'Order Delivered',
    message: `Your order from ${vendorName} has been delivered!`,
    related_order: orderId,
    related_vendor: vendorId,
    severity: 'success',
  });
```

#### **Example: Notify on vendor message**
```typescript
// In MessagingContext when vendor sends message:
await supabase
  .from('customer_notifications')
  .insert({
    customer_id: customerId,
    type: 'VendorMessage',
    title: 'New Message',
    message: `You have a new message from ${vendorName}`,
    related_vendor: vendorId,
    severity: 'info',
  });
```

---

## 🎨 UI Elements

### Notification Bell Badge
The bell icon automatically shows:
- Red badge with unread count
- "99+" for counts over 99
- Updates in real-time

### Notification Modal Features
- Grouped by date
- Color-coded severity (blue=info, green=success, yellow=warning, red=critical)
- Icons matching notification type
- Swipe or tap X to delete
- Tap notification to open related order

### Settings Modal
Customers can toggle:
- In-app, email, and push notifications
- Specific notification types (order placed, shipped, delivered, etc.)
- Review requests (opt-in only)
- Mute non-critical alerts

---

## 📊 Backend Event Triggers (Recommended)

For automated notifications, set up Supabase database triggers:

```sql
-- Example: Auto-notify when order status changes
CREATE OR REPLACE FUNCTION notify_customer_order_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Confirmed' AND OLD.status != 'Confirmed' THEN
    INSERT INTO customer_notifications (customer_id, type, title, message, related_order, severity)
    VALUES (
      NEW.customer_id,
      'OrderConfirmed',
      'Payment Confirmed',
      'Your order has been confirmed by the vendor.',
      NEW.order_id,
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_notification
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_order_update();
```

---

## 🔔 Push Notifications (Optional)

To enable push notifications:

1. **Install Expo Notifications**
   ```bash
   bun add expo-notifications
   ```

2. **Request permissions in CustomerAuthContext**
   ```typescript
   import * as Notifications from 'expo-notifications';
   
   const { status } = await Notifications.requestPermissionsAsync();
   ```

3. **Send push via backend**
   Use Expo Push API or Firebase Cloud Messaging

---

## 🧪 Testing

### Manual Test
1. Sign in as a customer
2. Tap the bell icon in the profile screen
3. Manually create a test notification:
   ```typescript
   const { createNotification } = useCustomerNotifications();
   
   await createNotification(
     'OrderPlaced',
     'Test Order',
     'This is a test notification',
     { severity: 'info' }
   );
   ```

### Test Scenarios
- [ ] Place an order → notification appears
- [ ] Vendor confirms payment → notification appears
- [ ] Order ships → notification appears
- [ ] Order delivered → notification appears
- [ ] Vendor sends message → notification appears
- [ ] Mark as read → badge count decreases
- [ ] Delete notification → removed from list
- [ ] Change preferences → reflected in UI

---

## 🎯 Notification Flow Summary

```
Customer Action          →  Notification Type       →  Display
─────────────────────────────────────────────────────────────────
Place order             →  OrderPlaced            →  ✅ Success
Vendor confirms payment →  OrderConfirmed         →  ✅ Success
Vendor ships order      →  OrderShipped           →  📦 Info
Carrier delivers        →  OrderDelivered         →  ✅ Success
Vendor sends message    →  VendorMessage          →  💬 Info
Tracking update         →  ShippingUpdate         →  📦 Info
Review request          →  ReviewRequest          →  ⭐ Info
Order canceled          →  OrderCanceled          →  ⚠️ Warning
Refund processed        →  RefundProcessed        →  ✅ Success
```

---

## 💡 Best Practices

1. **Respect user preferences** - Always check if notification type is enabled before sending
2. **Keep messages concise** - Titles ≤ 40 chars, messages ≤ 120 chars
3. **Use appropriate severity** - Critical only for urgent issues
4. **Include context** - Always link to related order/vendor when applicable
5. **Auto-archive old notifications** - The system does this automatically after 60 days

---

## 🚀 Production Checklist

- [ ] Database schema deployed to Supabase
- [ ] Row Level Security (RLS) policies enabled
- [ ] Notification triggers integrated into order flow
- [ ] Notification triggers integrated into messaging flow
- [ ] Notification triggers integrated into shipping flow
- [ ] Email notifications configured (optional)
- [ ] Push notifications configured (optional)
- [ ] Tested on iPhone, Android, iPad, and web
- [ ] User preferences tested and saved correctly

---

## 📞 Support

If notifications aren't appearing:
1. Check Supabase RLS policies are active
2. Verify user is authenticated
3. Check console logs for "[CustomerNotifications]" entries
4. Verify real-time subscriptions are connected
5. Test with manual `createNotification()` calls

---

**System Status**: ✅ Fully Implemented  
**Next Step**: Integrate notification triggers into OrdersContext and MessagingContext
