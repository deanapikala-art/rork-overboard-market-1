# 📱 Customer Notification System - Visual Guide

Quick visual reference for the Customer Notification System in Overboard Market.

---

## 🎨 UI Components

### 1. Notification Bell (Profile Screen)

```
┌─────────────────────────────────────────────┐
│  ☰ Menu              🔔³              👤     │  ← Top Bar
└─────────────────────────────────────────────┘
                        ↑
                   Bell Icon + Badge
                   (Red circle with count)
```

**States:**
- **No notifications**: Gray bell, no badge
- **Unread notifications**: Gray bell + red badge with count
- **99+ notifications**: Badge shows "99+"

---

### 2. Notification Dropdown Modal

```
                   Tap Bell ↓

┌─────────────────────────────────────────────┐
│  Notifications          Mark all read    ✕  │ ← Header
├─────────────────────────────────────────────┤
│                                             │
│  📦  Order Placed                      • ⓧ │ ← Unread (blue background)
│      Your order from Lakeside Crafts...    │
│      5m ago                                 │
├─────────────────────────────────────────────┤
│  ✅  Payment Confirmed                  ⓧ  │ ← Read (white background)
│      The Crafty Cabin confirmed...         │
│      2h ago                                 │
├─────────────────────────────────────────────┤
│  🚚  Order Shipped                      ⓧ  │
│      Your order has shipped via USPS...    │
│      1d ago                                 │
└─────────────────────────────────────────────┘
         ↑                             ↑
    Colored icon               Delete button
    (matches severity)
```

**Notification Colors:**
- **Blue** (info): Shipped, Messages, Updates
- **Green** (success): Confirmed, Delivered
- **Yellow** (warning): Delays, Issues
- **Red** (critical): Cancelled, Urgent

---

### 3. Notification Settings Modal

```
               Tap "Notification Settings" ↓

┌─────────────────────────────────────────────┐
│  Notification Settings                   ✕  │
├─────────────────────────────────────────────┤
│  Delivery Methods                           │
│  ┌─────────────────────────────────────┐   │
│  │ 🔔 In-App Notifications      [ON] ──│   │
│  │ 📧 Email Notifications       [ON] ──│   │
│  │ 📱 Push Notifications        [OFF] ─│   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Notification Types                         │
│  ┌─────────────────────────────────────┐   │
│  │ Order Placed                 [ON] ──│   │
│  │ Order Confirmed              [ON] ──│   │
│  │ Order Shipped                [ON] ──│   │
│  │ Order Delivered              [ON] ──│   │
│  │ Vendor Messages              [ON] ──│   │
│  │ Shipping Updates             [ON] ──│   │
│  │ Review Requests              [OFF] ─│   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Priority Settings                          │
│  ┌─────────────────────────────────────┐   │
│  │ 🔇 Mute Non-Critical         [OFF] ─│   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  [ Cancel ]          [ Save Changes ]       │ ← Footer
└─────────────────────────────────────────────┘
```

---

## 🔔 Notification Types & Icons

| Type | Icon | Color | When It Appears |
|------|------|-------|----------------|
| **OrderPlaced** | 📦 Package | Green | Customer completes checkout |
| **OrderConfirmed** | ✅ Check | Green | Vendor confirms payment |
| **OrderShipped** | 🚚 Truck | Blue | Vendor adds tracking info |
| **OrderDelivered** | ✅ Check | Green | Carrier confirms delivery |
| **VendorMessage** | 💬 Chat | Blue | Vendor sends message |
| **ShippingUpdate** | 🚚 Truck | Blue | Tracking status changes |
| **ReviewRequest** | ⭐ Star | Blue | 3 days after delivery |
| **OrderCanceled** | ⚠️ Warning | Yellow | Order cancelled by vendor/admin |
| **RefundProcessed** | ✅ Check | Green | Refund completed |

---

## 📊 Notification Flow Diagram

```
Customer Action                 System Event                  Customer Sees
─────────────────────────────────────────────────────────────────────────────

  🛒 Place Order     →    Create order in DB      →    🔔¹ "Order Placed"
                          Insert notification           Bell badge appears

  ⏳ Wait...         →    Vendor reviews order    →    (No notification)

  ✓ Vendor Confirms  →    Update order status     →    🔔² "Payment Confirmed"
                          Insert notification           Badge count: 2

  📦 Vendor Ships    →    Add tracking info       →    🔔³ "Order Shipped"
                          Insert notification           Badge count: 3
                          Start auto-tracking

  🚚 In Transit...   →    Tracking API polling    →    (No new notification)

  📬 Delivered!      →    Auto-detect delivery    →    🔔⁴ "Order Delivered"
                          Update order status           Badge count: 4
                          Insert notification

  👀 Customer Taps   →    Mark notification read  →    Badge count: 3
  Bell Icon               Navigate to order             (1 still unread)

  ✓ Mark All Read    →    Update all is_read      →    Badge disappears
                                                        Bell shows gray
```

---

## 🎯 User Journey Example

### Sarah's Order Journey

**Day 1 - 10:00 AM**: Sarah places order
```
┌────────────────────────────────────┐
│  🔔¹                               │
│  ┌──────────────────────────────┐ │
│  │ 📦 Order Placed              │ │
│  │ Your order from Lakeside...  │ │
│  │ Just now                     │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

**Day 1 - 2:30 PM**: Vendor confirms payment
```
┌────────────────────────────────────┐
│  🔔²                               │
│  ┌──────────────────────────────┐ │
│  │ ✅ Payment Confirmed         │ │
│  │ Lakeside Crafts confirmed... │ │
│  │ Just now                     │ │
│  ├──────────────────────────────┤ │
│  │ 📦 Order Placed              │ │
│  │ Your order from Lakeside...  │ │
│  │ 4h ago                       │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

**Day 2 - 9:00 AM**: Order ships
```
┌────────────────────────────────────┐
│  🔔³                               │
│  ┌──────────────────────────────┐ │
│  │ 🚚 Order Shipped!            │ │
│  │ Your order has shipped via   │ │
│  │ USPS. Track it now!          │ │
│  │ Just now                     │ │
│  ├──────────────────────────────┤ │
│  │ ✅ Payment Confirmed         │ │
│  │ Lakeside Crafts confirmed... │ │
│  │ 19h ago                      │ │
│  ├──────────────────────────────┤ │
│  │ 📦 Order Placed              │ │
│  │ Your order from Lakeside...  │ │
│  │ 1d ago                       │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

**Day 5 - 3:00 PM**: Package delivered
```
┌────────────────────────────────────┐
│  🔔⁴                               │
│  ┌──────────────────────────────┐ │
│  │ ✅ Order Delivered           │ │
│  │ Your order from Lakeside...  │ │
│  │ was delivered by USPS!       │ │
│  │ Just now                     │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

Sarah taps the notification → navigates to order details → sees delivery confirmation and tracking history

---

## 🔄 Real-Time Sync Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Sarah's Phone                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Profile Screen                                             │ │
│  │  ┌──────────┐                                               │ │
│  │  │ 🔔³      │  ← Bell with badge                            │ │
│  │  └──────────┘                                               │ │
│  │       ↕ Real-time WebSocket (Supabase Realtime)            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               ↕
                    Instant Push (< 100ms)
                               ↕
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Database                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  customer_notifications                                     │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  INSERT new row                                       │  │ │
│  │  │  notification_id: CNT-abc123                          │  │ │
│  │  │  customer_id: sarah-user-id                           │  │ │
│  │  │  type: OrderShipped                                   │  │ │
│  │  │  title: "Order Shipped!"                              │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                ↕ Triggered by                               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               ↑
                     Event from system
                               ↑
┌─────────────────────────────────────────────────────────────────┐
│                    OrdersContext.addShippingInfo()               │
│  await supabase.from('customer_notifications').insert({...})    │
└─────────────────────────────────────────────────────────────────┘
```

**Key Point**: No polling! Notifications appear instantly via WebSocket push.

---

## 📱 Mobile Responsive Design

### iPhone / Android (Portrait)
```
┌────────────────────────┐
│  ☰        🔔³       👤 │ ← Compact top bar
├────────────────────────┤
│                        │
│  Profile Info          │
│                        │
│  ┌──────────────────┐ │
│  │ Account Info     │ │ ← Stacked sections
│  └──────────────────┘ │
│                        │
│  ┌──────────────────┐ │
│  │ [📱 Notification │ │ ← Settings button
│  │  Settings]       │ │
│  └──────────────────┘ │
│                        │
└────────────────────────┘
```

### iPad (Landscape)
```
┌────────────────────────────────────────────────────────────┐
│  ☰                          🔔³                         👤 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │ Profile Info     │  │ Account Information          │  │
│  │                  │  │                              │  │ ← 2-column layout
│  │                  │  │ [Notification Settings]      │  │
│  └──────────────────┘  └──────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Web (Desktop)
```
┌────────────────────────────────────────────────────────────────────┐
│  ☰ Menu                                       🔔³  Profile  👤     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ Profile Card    │  │ Account Details  │  │ Saved Items     │  │
│  │                 │  │                  │  │                 │  │ ← 3-column
│  │                 │  │ [Notification    │  │                 │  │
│  │                 │  │  Settings]       │  │                 │  │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Palette

### Notification Severity Colors

| Severity | Background | Icon/Text | Use Case |
|----------|-----------|----------|----------|
| **Info** | `#EFF6FF` (light blue) | `#3B82F6` (blue) | Shipping, messages, general updates |
| **Success** | `#F0FDF4` (light green) | `#10B981` (green) | Confirmed, delivered, completed |
| **Warning** | `#FFFBEB` (light yellow) | `#F59E0B` (yellow) | Delays, attention needed |
| **Critical** | `#FEF2F2` (light red) | `#DC2626` (red) | Cancelled, urgent issues |

### UI Elements

| Element | Color | Usage |
|---------|-------|-------|
| **Badge** | `#DC2626` (red) | Unread count on bell icon |
| **Badge Text** | `#FFFFFF` (white) | Count number |
| **Unread Background** | `#F0F9FF` (light blue) | Notification list item |
| **Unread Dot** | `#3B82F6` (blue) | Small indicator |
| **Divider** | `#E5E7EB` (light gray) | Between notifications |
| **Delete Icon** | `#9CA3AF` (gray) | Remove button |

---

## 🧪 Testing Scenarios Visualization

### Test Flow 1: Complete Order Journey
```
Place Order  →  Confirm  →  Ship  →  Deliver
    ↓            ↓          ↓         ↓
   🔔¹         🔔²        🔔³       🔔⁴
  Badge:1     Badge:2    Badge:3   Badge:4
```

### Test Flow 2: Mark as Read
```
4 Unread  →  Tap Notification  →  3 Unread  →  Mark All Read  →  0 Unread
  🔔⁴              ↓                 🔔³              ↓              🔔
Badge:4        Navigate           Badge:3        Clear all       No badge
```

### Test Flow 3: Delete Notification
```
3 Unread  →  Swipe Left / Tap ✕  →  2 Unread
  🔔³              ↓                   🔔²
 Badge:3      Remove item           Badge:2
```

---

## 📋 Quick Reference Card

### Customer Actions

| Customer Does | Notification Appears | Badge Count |
|--------------|---------------------|-------------|
| Places order | OrderPlaced (green) | +1 |
| Receives payment confirmation | OrderConfirmed (green) | +1 |
| Order ships | OrderShipped (blue) | +1 |
| Package delivered | OrderDelivered (green) | +1 |
| Vendor messages | VendorMessage (blue) | +1 |
| Taps notification | Navigate to order | -1 |
| Marks all read | Clear all unread | 0 |
| Deletes notification | Remove from list | -1 (if unread) |

### Admin Reference

| Notification Type | Trigger | Database Insert Required? |
|------------------|---------|-------------------------|
| OrderPlaced | createOrder() | Yes |
| OrderConfirmed | confirmOrder() | Yes |
| OrderShipped | addShippingInfo() | Yes |
| OrderDelivered | markAsDelivered() or auto-detect | Yes |
| VendorMessage | Vendor sends message | Yes |
| ReviewRequest | 3 days after delivery | Optional (scheduled) |

---

## 🚀 Implementation Checklist Visualization

```
Setup Phase                     Integration Phase              Testing Phase
───────────                     ─────────────────              ─────────────

✅ Database Schema    →         ⏳ OrdersContext      →        ⏳ End-to-end test
   (SQL executed)                 (5 integration points)         (All flows)

✅ Context Provider   →         ⏳ MessagingContext   →        ⏳ Device testing
   (State management)             (1 integration point)          (iOS/Android/Web)

✅ Bell Component     →         ⏳ DeliveryTracking   →        ⏳ Load testing
   (UI implemented)               (1 integration point)          (Many notifications)

✅ Settings Modal     →         ⏳ Review system      →        ⏳ User acceptance
   (Preferences UI)               (Optional)                     (Real customers)

✅ Layout Integration
   (Provider added)

Status: 60% Complete            Status: 0% Complete           Status: 0% Complete
```

---

## 💡 Pro Tips Summary

**For Best Results:**

1. **Always wrap notification inserts in try-catch** ✓
2. **Don't break core functionality if notification fails** ✓
3. **Check user preferences before sending** ✓
4. **Use descriptive, actionable messages** ✓
5. **Include vendor/order context in every notification** ✓
6. **Test on all platforms (iOS, Android, Web)** ✓
7. **Monitor badge counts in real-time** ✓

---

**Visual Guide Version**: 1.0.0  
**Last Updated**: November 9, 2025  
**Status**: Production Ready (Pending Integration)
