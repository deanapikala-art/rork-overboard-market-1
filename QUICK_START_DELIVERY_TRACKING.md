# 🚀 Quick Start: Add Delivery Tracking to Your App

## 1️⃣ Apply Database Schema (Required)
```bash
psql -U postgres -d overboard_db -f app/utils/deliveryTrackingSchema.sql
```
Or run via Supabase Dashboard → SQL Editor

---

## 2️⃣ Add to Vendor Dashboard

### In your vendor order list or detail view:

```tsx
import { useState } from 'react';
import AddShippingModal from '@/app/components/AddShippingModal';
import { useOrders } from '@/app/contexts/OrdersContext';
import { Truck } from 'lucide-react-native';

export default function VendorOrderView() {
  const { addShippingInfo, markAsDelivered } = useOrders();
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <>
      {/* Button to add shipping */}
      <TouchableOpacity
        onPress={() => {
          setSelectedOrder(order);
          setShowShippingModal(true);
        }}
      >
        <Truck size={18} color={Colors.white} />
        <Text>Add Shipping Info</Text>
      </TouchableOpacity>

      {/* Modal */}
      <AddShippingModal
        visible={showShippingModal}
        onClose={() => {
          setShowShippingModal(false);
          setSelectedOrder(null);
        }}
        onSubmit={async (shippingInfo) => {
          if (selectedOrder) {
            await addShippingInfo(selectedOrder.id, shippingInfo);
          }
        }}
        orderNumber={selectedOrder?.order_number || ''}
      />

      {/* Manual delivery button (for orders already shipped) */}
      {order.shipping_status === 'shipped' && (
        <TouchableOpacity onPress={() => markAsDelivered(order.id, 'Vendor')}>
          <Text>Mark as Delivered</Text>
        </TouchableOpacity>
      )}
    </>
  );
}
```

---

## 3️⃣ Show Status to Customer

### In order detail or customer order history:

```tsx
import ShippingStatusCard from '@/app/components/ShippingStatusCard';
import { useOrders } from '@/app/contexts/OrdersContext';

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams();
  const { getOrderById, markAsDelivered } = useOrders();
  const order = getOrderById(id);

  if (!order) return <Text>Order not found</Text>;

  return (
    <ScrollView>
      {/* Show shipping status if order has been shipped */}
      {order.shipping_status !== 'pending' && (
        <ShippingStatusCard
          shippingStatus={order.shipping_status}
          shippingProvider={order.shipping_provider}
          trackingNumber={order.tracking_number}
          trackingUrl={order.tracking_url}
          shippedAt={order.shipped_at}
          deliveredAt={order.delivered_at}
          deliveryConfirmedBy={order.delivery_confirmed_by}
          estimatedDeliveryDate={order.estimated_delivery_date}
          deliveryNotes={order.delivery_notes}
          isLocalPickup={order.is_local_pickup}
        />
      )}

      {/* Customer confirmation button */}
      {order.shipping_status === 'shipped' && (
        <TouchableOpacity onPress={() => markAsDelivered(order.id, 'Customer')}>
          <Text>Confirm Received</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
```

---

## 4️⃣ Local Pickup Support

```tsx
const { markAsPickedUp } = useOrders();

// Mark order as ready for pickup
<TouchableOpacity onPress={async () => {
  await addShippingInfo(order.id, {
    provider: 'Local Pickup',
    trackingNumber: 'PICKUP',
    enableAutoTracking: false,
  });
  // Then update to pickup_ready status manually via database
}}>
  <Text>Ready for Pickup</Text>
</TouchableOpacity>

// Mark as picked up
<TouchableOpacity onPress={() => markAsPickedUp(order.id)}>
  <Text>Mark as Picked Up</Text>
</TouchableOpacity>
```

---

## 📊 Check Order Status

```tsx
const { customerOrders, vendorOrders } = useOrders();

// Filter by status
const shippedOrders = vendorOrders.filter(o => o.shipping_status === 'shipped');
const deliveredOrders = customerOrders.filter(o => o.shipping_status === 'delivered');

// Check if order needs shipping info
const needsShipping = order.status === 'completed' && order.shipping_status === 'pending';
```

---

## 🎨 Status Badge Colors

Use these in your custom UI if needed:

```tsx
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return Colors.light.muted;
    case 'shipped':
    case 'in_transit': return Colors.nautical.mustard;
    case 'out_for_delivery': return Colors.nautical.teal;
    case 'delivered':
    case 'picked_up': return '#22C55E';
    case 'pickup_ready': return Colors.nautical.oceanDeep;
    default: return Colors.light.muted;
  }
};
```

---

## 🔍 Tracking URL Generation

Automatic for these carriers:
- USPS → `https://tools.usps.com/go/TrackConfirmAction?tLabels=...`
- UPS → `https://www.ups.com/track?tracknum=...`
- FedEx → `https://www.fedex.com/fedextrack/?trknbr=...`
- DHL → `https://www.dhl.com/en/express/tracking.html?AWB=...`

For other carriers, URL will be `null`. You can manually construct it or skip the "Track Package" button.

---

## 🧪 Test Flow

1. Create test order as customer
2. Vendor goes to dashboard → Sales → Order detail
3. Click "Add Shipping Info"
4. Select USPS, enter tracking "9400111111111111111111"
5. Submit → Order status updates to "shipped"
6. Customer views order → Sees tracking card
7. Click "Track Package" → Opens USPS tracking
8. Vendor clicks "Mark as Delivered"
9. Customer sees "Delivered on [date]"

---

## 📚 Full Documentation

See `DELIVERY_TRACKING_IMPLEMENTATION.md` for:
- Complete database schema details
- Carrier API integration guide (EasyPost, 17Track)
- Analytics queries
- Troubleshooting

---

**That's it!** The system is fully functional with manual confirmation. Add carrier API integration later for automatic updates.
