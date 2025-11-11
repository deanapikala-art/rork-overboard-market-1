# Integration Example: Add Delivery Tracking to Existing Order Page

This shows how to integrate the delivery tracking system into your existing `/app/order/[id].tsx` file.

## Step 1: Add Imports

At the top of `app/order/[id].tsx`, add these imports:

```tsx
// Add these to existing imports
import { Truck } from 'lucide-react-native';  // Add Truck to your lucide imports
import ShippingStatusCard from '@/app/components/ShippingStatusCard';
import AddShippingModal from '@/app/components/AddShippingModal';
import { useOrders } from '@/app/contexts/OrdersContext';
```

## Step 2: Replace Mock Data with Real Orders

Replace the `mockOrders` constant and order retrieval with real data:

```tsx
// REPLACE THIS:
// const order = mockOrders[id as string];

// WITH THIS:
export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrderById, addShippingInfo, markAsDelivered } = useOrders();
  const order = getOrderById(id as string);
  
  const [showShippingModal, setShowShippingModal] = useState(false);
  
  // ... rest of your state
```

## Step 3: Add Shipping Section (After Order Header)

In your JSX, add this section after the header/customer info and before the order items:

```tsx
<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
  {/* Existing Header Section */}
  <View style={styles.header}>
    {/* ... your existing header code ... */}
  </View>

  {/* NEW: Shipping Status Section - Add this */}
  {order && order.shipping_status && order.shipping_status !== 'pending' && (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Shipping & Delivery</Text>
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
    </View>
  )}

  {/* Existing Order Items Section */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Order Items</Text>
    {/* ... your existing items code ... */}
  </View>
```

## Step 4: Add Vendor Shipping Buttons (Replace "Mark as Shipped" Button)

Find your existing "Mark as Shipped" button and replace it with this enhanced version:

```tsx
{/* REPLACE your existing action buttons section with this: */}
<View style={styles.actionButtons}>
  {/* Show Add Shipping button if order is confirmed but not shipped */}
  {order.status === 'completed' && order.shipping_status === 'pending' && (
    <TouchableOpacity 
      style={styles.primaryButton}
      onPress={() => setShowShippingModal(true)}
    >
      <Truck size={20} color={Colors.white} />
      <Text style={styles.primaryButtonText}>Add Shipping Info</Text>
    </TouchableOpacity>
  )}

  {/* Show Mark as Delivered button if already shipped */}
  {order.shipping_status === 'shipped' && (
    <TouchableOpacity 
      style={styles.primaryButton}
      onPress={() => {
        Alert.alert(
          'Confirm Delivery',
          'Mark this order as delivered?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Confirm', 
              onPress: async () => {
                const success = await markAsDelivered(order.id, 'Vendor');
                if (success) {
                  Alert.alert('Success', 'Order marked as delivered');
                }
              }
            },
          ]
        );
      }}
    >
      <CheckCircle size={20} color={Colors.white} />
      <Text style={styles.primaryButtonText}>Mark as Delivered</Text>
    </TouchableOpacity>
  )}

  {/* Keep your existing Contact Customer button */}
  <TouchableOpacity style={styles.secondaryButton}>
    <Text style={styles.secondaryButtonText}>Contact Customer</Text>
  </TouchableOpacity>
</View>

{/* Add the shipping modal at the end, before closing ScrollView */}
<AddShippingModal
  visible={showShippingModal}
  onClose={() => setShowShippingModal(false)}
  onSubmit={async (shippingInfo) => {
    const success = await addShippingInfo(order.id, shippingInfo);
    if (!success) {
      Alert.alert('Error', 'Failed to add shipping information');
    }
  }}
  orderNumber={order.orderNumber}
/>
```

## Step 5: Add Customer Confirmation Button

For the customer view (when `!isVendor`), add this button:

```tsx
{/* Customer can confirm receipt */}
{!isVendor && order.shipping_status === 'shipped' && (
  <TouchableOpacity 
    style={styles.confirmReceivedButton}
    onPress={async () => {
      const success = await markAsDelivered(order.id, 'Customer');
      if (success) {
        Alert.alert('Thank You', 'Order marked as received');
      }
    }}
  >
    <CheckCircle size={18} color={Colors.white} />
    <Text style={styles.confirmReceivedButtonText}>Confirm Received</Text>
  </TouchableOpacity>
)}
```

## Step 6: Add New Styles

Add these styles to your existing StyleSheet:

```tsx
const styles = StyleSheet.create({
  // ... your existing styles ...
  
  confirmReceivedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  confirmReceivedButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
```

## Complete Integration Checklist

- [ ] Import `ShippingStatusCard` and `AddShippingModal`
- [ ] Import `useOrders` hook
- [ ] Replace mock data with `getOrderById()`
- [ ] Add `showShippingModal` state
- [ ] Add shipping status section with `ShippingStatusCard`
- [ ] Replace "Mark as Shipped" with "Add Shipping Info" button
- [ ] Add "Mark as Delivered" button for shipped orders
- [ ] Add `AddShippingModal` component
- [ ] Add customer "Confirm Received" button
- [ ] Add new styles for buttons
- [ ] Test with real order data

## Testing the Integration

1. Open an order in vendor view
2. Click "Add Shipping Info"
3. Fill out the modal and submit
4. Verify `ShippingStatusCard` appears
5. Click "Track Package" - should open carrier site
6. Click "Mark as Delivered"
7. Verify status updates to "Delivered"

## Notes

- **isVendor Detection**: You may need to add logic to detect if current user is the vendor for this order. For example:
  ```tsx
  const { vendorSession } = useVendorAuth();
  const isVendor = order.vendor_id === vendorSession?.id;
  ```

- **Order Status Logic**: The buttons show/hide based on:
  - `order.status === 'completed'` (payment confirmed)
  - `order.shipping_status === 'pending'` (not yet shipped)
  - `order.shipping_status === 'shipped'` (shipped, can be marked delivered)

- **Real-Time Updates**: After calling `addShippingInfo` or `markAsDelivered`, the context automatically refreshes order data, so your UI will update.

## Alternative: Simpler Integration

If you just want to show tracking without the modal, use this minimal version:

```tsx
// Just add the status card
{order.shipping_status !== 'pending' && (
  <ShippingStatusCard {...order} />
)}
```

Then manually update shipping info via vendor dashboard instead of in the order detail page.
