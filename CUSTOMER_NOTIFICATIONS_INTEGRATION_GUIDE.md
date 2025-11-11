# 🔗 Customer Notifications - Integration Guide

This guide shows you exactly where and how to add customer notification triggers to your existing Overboard Market codebase.

---

## 📍 Integration Locations

### 1. OrdersContext - Order Created
**File**: `app/contexts/OrdersContext.tsx`  
**Function**: `createOrder()`  
**Location**: After successful order creation

**Add this code after line where order is successfully created:**

```typescript
// After this line:
const { data: newOrder, error: insertError } = await supabase
  .from('user_orders')
  .insert({
    // ... order data
  })
  .select()
  .single();

if (newOrder && !insertError) {
  // ✅ ADD THIS: Create OrderPlaced notification
  try {
    await supabase
      .from('customer_notifications')
      .insert({
        customer_id: user.id,
        type: 'OrderPlaced',
        title: 'Order Placed Successfully',
        message: `Your order from ${params.vendorName} has been placed. Total: $${calculatedTotal.toFixed(2)}`,
        related_order: newOrder.id,
        related_vendor: params.vendorId,
        severity: 'success',
      });
    console.log('[Orders] OrderPlaced notification created');
  } catch (notifError) {
    console.error('[Orders] Failed to create notification:', notifError);
    // Don't fail the order if notification fails
  }
  // ✅ END ADDITION

  return newOrder as Order;
}
```

---

### 2. OrdersContext - Order Confirmed by Vendor
**File**: `app/contexts/OrdersContext.tsx`  
**Function**: `confirmOrder()`  
**Location**: After order status is updated to completed

**Add this code after order confirmation update:**

```typescript
// After this line:
const { data: updatedOrder, error } = await supabase
  .from('user_orders')
  .update({
    status: 'completed',
    confirmed_by_vendor: true,
    confirmed_at: new Date().toISOString(),
    vendor_notes: notes,
    external_transaction_id: transactionId,
  })
  .eq('id', orderId)
  .select()
  .single();

if (updatedOrder && !error) {
  // ✅ ADD THIS: Create OrderConfirmed notification
  try {
    await supabase
      .from('customer_notifications')
      .insert({
        customer_id: updatedOrder.customer_id,
        type: 'OrderConfirmed',
        title: 'Payment Confirmed',
        message: `${updatedOrder.vendor_name} has confirmed your payment. Your order is being prepared!`,
        related_order: orderId,
        related_vendor: updatedOrder.vendor_id,
        severity: 'success',
      });
    console.log('[Orders] OrderConfirmed notification created');
  } catch (notifError) {
    console.error('[Orders] Failed to create notification:', notifError);
  }
  // ✅ END ADDITION

  await loadCustomerOrders();
  await loadVendorOrders();
  return true;
}
```

---

### 3. OrdersContext - Shipping Info Added
**File**: `app/contexts/OrdersContext.tsx`  
**Function**: `addShippingInfo()`  
**Location**: After shipping info is added to order

**Add this code after shipping info update:**

```typescript
// After this line:
const { data: updatedOrder, error } = await supabase
  .from('user_orders')
  .update({
    shipping_status: 'shipped',
    shipping_provider: shippingInfo.provider,
    tracking_number: shippingInfo.trackingNumber,
    tracking_url: trackingUrl,
    shipped_at: new Date().toISOString(),
    estimated_delivery_date: shippingInfo.estimatedDelivery,
    delivery_notes: shippingInfo.notes,
    auto_status_updates_enabled: shippingInfo.enableAutoTracking || false,
  })
  .eq('id', orderId)
  .select()
  .single();

if (updatedOrder && !error) {
  // ✅ ADD THIS: Create OrderShipped notification
  try {
    const trackingMessage = shippingInfo.trackingNumber
      ? `Your order has shipped via ${shippingInfo.provider}. Track it now!`
      : `Your order has been marked as shipped by ${updatedOrder.vendor_name}.`;
    
    await supabase
      .from('customer_notifications')
      .insert({
        customer_id: updatedOrder.customer_id,
        type: 'OrderShipped',
        title: 'Order Shipped!',
        message: trackingMessage,
        related_order: orderId,
        related_vendor: updatedOrder.vendor_id,
        severity: 'info',
      });
    console.log('[Orders] OrderShipped notification created');
  } catch (notifError) {
    console.error('[Orders] Failed to create notification:', notifError);
  }
  // ✅ END ADDITION

  await loadCustomerOrders();
  await loadVendorOrders();
  return true;
}
```

---

### 4. OrdersContext - Order Delivered
**File**: `app/contexts/OrdersContext.tsx`  
**Function**: `markAsDelivered()`  
**Location**: After order is marked as delivered

**Add this code after delivery status update:**

```typescript
// After this line:
const { data: updatedOrder, error } = await supabase
  .from('user_orders')
  .update({
    shipping_status: 'delivered',
    delivered_at: new Date().toISOString(),
    delivery_confirmed_by: confirmedBy,
  })
  .eq('id', orderId)
  .select()
  .single();

if (updatedOrder && !error) {
  // ✅ ADD THIS: Create OrderDelivered notification
  try {
    await supabase
      .from('customer_notifications')
      .insert({
        customer_id: updatedOrder.customer_id,
        type: 'OrderDelivered',
        title: 'Order Delivered',
        message: `Your order from ${updatedOrder.vendor_name} has been delivered. Enjoy!`,
        related_order: orderId,
        related_vendor: updatedOrder.vendor_id,
        severity: 'success',
      });
    console.log('[Orders] OrderDelivered notification created');
  } catch (notifError) {
    console.error('[Orders] Failed to create notification:', notifError);
  }
  // ✅ END ADDITION

  await loadCustomerOrders();
  await loadVendorOrders();
  return true;
}
```

---

### 5. OrdersContext - Order Cancelled
**File**: `app/contexts/OrdersContext.tsx`  
**Function**: `cancelOrder()`  
**Location**: After order is cancelled

**Add this code after order cancellation:**

```typescript
// After this line:
const { data: updatedOrder, error } = await supabase
  .from('user_orders')
  .update({
    status: 'cancelled',
  })
  .eq('id', orderId)
  .select()
  .single();

if (updatedOrder && !error) {
  // ✅ ADD THIS: Create OrderCanceled notification
  try {
    await supabase
      .from('customer_notifications')
      .insert({
        customer_id: updatedOrder.customer_id,
        type: 'OrderCanceled',
        title: 'Order Cancelled',
        message: `Your order from ${updatedOrder.vendor_name} has been cancelled.`,
        related_order: orderId,
        related_vendor: updatedOrder.vendor_id,
        severity: 'warning',
      });
    console.log('[Orders] OrderCanceled notification created');
  } catch (notifError) {
    console.error('[Orders] Failed to create notification:', notifError);
  }
  // ✅ END ADDITION

  await loadCustomerOrders();
  await loadVendorOrders();
  return true;
}
```

---

### 6. MessagingContext - Vendor Messages Customer
**File**: `app/contexts/MessagingContext.tsx`  
**Location**: When vendor sends message to customer

**Add this code after message is successfully sent:**

```typescript
// After message insert succeeds
const { data: newMessage, error: insertError } = await supabase
  .from('messages')
  .insert({
    // ... message data
  })
  .select()
  .single();

if (newMessage && !insertError) {
  // ✅ ADD THIS: Create VendorMessage notification (only if sender is vendor)
  try {
    // Check if sender is vendor and recipient is customer
    const isVendorToCustomer = newMessage.sender_role === 'vendor' && newMessage.recipient_role === 'customer';
    
    if (isVendorToCustomer) {
      await supabase
        .from('customer_notifications')
        .insert({
          customer_id: newMessage.recipient_id,
          type: 'VendorMessage',
          title: 'New Message',
          message: `You have a new message from ${newMessage.sender_name}`,
          related_vendor: newMessage.sender_id,
          severity: 'info',
        });
      console.log('[Messaging] VendorMessage notification created');
    }
  } catch (notifError) {
    console.error('[Messaging] Failed to create notification:', notifError);
  }
  // ✅ END ADDITION
}
```

---

### 7. Delivery Tracking - Auto Delivery Detection
**File**: `app/utils/deliveryTracking.ts`  
**Function**: Where delivery status is detected  
**Location**: In the auto-tracking polling or webhook handler

**Add this code when delivery is detected:**

```typescript
// When tracking API returns "delivered" status
if (trackingStatus === 'delivered') {
  // Update order status first
  const { data: updatedOrder, error } = await supabase
    .from('user_orders')
    .update({
      shipping_status: 'delivered',
      delivered_at: new Date().toISOString(),
      delivery_confirmed_by: 'System',
    })
    .eq('id', orderId)
    .select()
    .single();

  if (updatedOrder && !error) {
    // ✅ ADD THIS: Create OrderDelivered notification
    try {
      await supabase
        .from('customer_notifications')
        .insert({
          customer_id: updatedOrder.customer_id,
          type: 'OrderDelivered',
          title: 'Package Delivered',
          message: `Your order from ${updatedOrder.vendor_name} was delivered by ${updatedOrder.shipping_provider}!`,
          related_order: orderId,
          related_vendor: updatedOrder.vendor_id,
          severity: 'success',
        });
      console.log('[DeliveryTracking] Auto-detected delivery notification created');
    } catch (notifError) {
      console.error('[DeliveryTracking] Failed to create notification:', notifError);
    }
    // ✅ END ADDITION
  }
}
```

---

### 8. OPTIONAL - Review Reminders (Future Enhancement)
**Trigger**: 3 days after delivery  
**Implementation**: Use a scheduled job or Supabase edge function

```typescript
// Example: Scheduled job that runs daily
async function sendReviewReminders() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Find orders delivered 3 days ago with no review
  const { data: orders } = await supabase
    .from('user_orders')
    .select('*')
    .eq('shipping_status', 'delivered')
    .gte('delivered_at', threeDaysAgo.toISOString())
    .lte('delivered_at', new Date(threeDaysAgo.getTime() - 86400000).toISOString()) // 3 days ago exactly
    .is('review_id', null); // Assuming you have a review reference

  for (const order of orders || []) {
    // Check user preferences
    const { data: prefs } = await supabase
      .from('customer_notification_preferences')
      .select('notify_review_requests')
      .eq('customer_id', order.customer_id)
      .single();

    if (prefs?.notify_review_requests) {
      await supabase
        .from('customer_notifications')
        .insert({
          customer_id: order.customer_id,
          type: 'ReviewRequest',
          title: 'How was your order?',
          message: `Share your experience with ${order.vendor_name} and help other shoppers!`,
          related_order: order.id,
          related_vendor: order.vendor_id,
          severity: 'info',
        });
    }
  }
}
```

---

## 🧪 Testing Your Integration

After adding the notification triggers, test each flow:

### Test Checklist

1. **Place an order**
   - [ ] OrderPlaced notification appears immediately
   - [ ] Bell badge shows "1"
   - [ ] Notification has correct vendor name and total

2. **Vendor confirms payment**
   - [ ] OrderConfirmed notification appears
   - [ ] Message mentions vendor name
   - [ ] Severity is "success" (green)

3. **Vendor ships order**
   - [ ] OrderShipped notification appears
   - [ ] Includes tracking provider if available
   - [ ] Severity is "info" (blue)

4. **Order delivered**
   - [ ] OrderDelivered notification appears
   - [ ] Message confirms delivery
   - [ ] Severity is "success" (green)

5. **Vendor sends message**
   - [ ] VendorMessage notification appears
   - [ ] Includes vendor name
   - [ ] Severity is "info" (blue)

6. **Order cancelled**
   - [ ] OrderCanceled notification appears
   - [ ] Severity is "warning" (yellow)

### Quick Test Function

Add this to any component for testing:

```typescript
import { useCustomerNotifications } from '@/app/contexts/CustomerNotificationsContext';

const { createNotification } = useCustomerNotifications();

// Test all notification types
const testAllNotifications = async () => {
  const types = [
    { type: 'OrderPlaced', title: 'Test Order Placed', severity: 'success' },
    { type: 'OrderConfirmed', title: 'Test Payment Confirmed', severity: 'success' },
    { type: 'OrderShipped', title: 'Test Order Shipped', severity: 'info' },
    { type: 'OrderDelivered', title: 'Test Order Delivered', severity: 'success' },
    { type: 'VendorMessage', title: 'Test New Message', severity: 'info' },
    { type: 'OrderCanceled', title: 'Test Order Cancelled', severity: 'warning' },
  ];

  for (const notif of types) {
    await createNotification(
      notif.type as any,
      notif.title,
      'This is a test notification',
      { severity: notif.severity as any }
    );
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tests
  }
};
```

---

## 🎯 Quick Summary

**Files to Modify:**
1. `app/contexts/OrdersContext.tsx` - 5 integration points
2. `app/contexts/MessagingContext.tsx` - 1 integration point
3. `app/utils/deliveryTracking.ts` - 1 integration point

**Total Code Additions**: ~200 lines (mostly similar patterns)

**Estimated Time**: 30-45 minutes

**Testing Time**: 15-20 minutes

---

## 💡 Pro Tips

1. **Always wrap notification creation in try-catch** - Don't let notification failures break core functionality

2. **Check user preferences before sending** - Respect opt-outs:
   ```typescript
   const { data: prefs } = await supabase
     .from('customer_notification_preferences')
     .select('notify_order_shipped')
     .eq('customer_id', customerId)
     .single();
   
   if (prefs?.notify_order_shipped) {
     // Send notification
   }
   ```

3. **Log everything** - Use `console.log` for debugging:
   ```typescript
   console.log('[Context] Creating notification:', { type, orderId, customerId });
   ```

4. **Use descriptive messages** - Include vendor name, order number, or other context

5. **Set appropriate severity** - Helps users prioritize:
   - `success`: Positive events (confirmed, delivered)
   - `info`: General updates (shipped, messages)
   - `warning`: Needs attention (delayed, issues)
   - `critical`: Urgent (cancelled with payment issues)

---

## 🚨 Common Pitfalls

**❌ Don't do this:**
```typescript
// This will break order creation if notification fails
await supabase.from('customer_notifications').insert(...);
return newOrder;
```

**✅ Do this instead:**
```typescript
// Wrap in try-catch so order succeeds even if notification fails
try {
  await supabase.from('customer_notifications').insert(...);
} catch (error) {
  console.error('Notification failed:', error);
  // Don't return or throw - continue with order creation
}
return newOrder;
```

---

## 📞 Need Help?

If you encounter issues:

1. Check Supabase SQL Editor for RLS policy errors
2. Look for console logs starting with `[CustomerNotifications]`
3. Verify the notification was inserted in Supabase dashboard
4. Test real-time subscriptions in Supabase Realtime tab
5. Ensure customer_id matches authenticated user

---

**Status**: Ready for Integration  
**Difficulty**: Easy  
**Impact**: High - Completes the customer communication loop!
