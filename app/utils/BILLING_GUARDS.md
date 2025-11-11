# Billing Route Guards

This document describes the implementation of billing route guards for vendor permissions.

## Overview

The billing route guards ensure that vendors meet payment requirements before they can:
1. Publish their booth to the marketplace
2. Go live during events

Browsing by shoppers is never blocked by these guards.

## Functions

### `canPublishToMarketplace(vendor: Vendor): MarketplacePublishGuardResult`

Checks if a vendor can publish their booth to the marketplace.

**Requirements:**
- `vendor.billingStatusMarketplace` must be `'active'` OR `'waived'`

**Returns:**
```typescript
{
  allowed: boolean;
  reason?: string; // Error message if not allowed
}
```

**Usage Example:**
```typescript
import { canPublishToMarketplace } from '@/utils/billingGuards';

const vendor = vendors.find(v => v.id === '1');
const guard = canPublishToMarketplace(vendor);

if (!guard.allowed) {
  alert(guard.reason); // e.g., "Please activate your marketplace listing in the Billing tab"
  return;
}

// Proceed with publishing
```

---

### `canGoLiveInEvent(eventVendor: EventVendor): EventLiveGuardResult`

Checks if a vendor can set their live status to 'live' during an event.

**Requirements:**
- `eventVendor.feeStatus` must be `'paid'` OR `'waived'`

**Returns:**
```typescript
{
  allowed: boolean;
  reason?: string; // Error message if not allowed
}
```

**Usage Example:**
```typescript
import { canGoLiveInEvent } from '@/utils/billingGuards';

const eventVendor = eventVendors.find(ev => ev.id === '1');
const guard = canGoLiveInEvent(eventVendor);

if (!guard.allowed) {
  alert(guard.reason); // e.g., "Please pay the event fee to go live"
  return;
}

// Proceed with going live
setLiveStatus('live');
```

---

## Helper Functions

### `getMarketplaceStatusLabel(status)`
Returns a human-readable label for marketplace billing status.

### `getEventFeeStatusLabel(status)`
Returns a human-readable label for event fee status.

### `shouldShowMarketplaceBilling(vendor)`
Returns `true` if the vendor should be prompted to pay marketplace fees.

### `shouldShowEventFeeBilling(eventVendor)`
Returns `true` if the vendor should be prompted to pay event fees.

---

## Integration Points

### Vendor Dashboard
The guards are integrated into the Vendor Dashboard to:
- Disable "Go Live" buttons when event fees are unpaid
- Show warning messages when fees are pending
- Display payment status badges

See `app/(tabs)/vendor-dashboard.tsx` lines 602-616 for the live status guard implementation.

### Admin Panel
Admins can:
- Override billing status to 'waived' to bypass payment requirements
- Manually mark external payments as 'paid'
- Set custom fee amounts per vendor

---

## Payment Providers

### Stripe
When `paymentsProvider === 'stripe'`:
1. Vendor clicks "Pay Event Fee" or "Activate Marketplace Listing"
2. System creates a Stripe Checkout Session
3. Vendor completes payment on Stripe
4. Webhook receives `payment_intent.succeeded` event
5. System updates `VendorCharges.status = 'paid'`
6. System updates `vendor.billingStatusMarketplace = 'active'` OR `eventVendor.feeStatus = 'paid'`

### External (PayPal, Zelle, etc.)
When `paymentsProvider === 'external'`:
1. System displays payment instructions (admin-configured)
2. Vendor pays via external method (PayPal, Zelle, bank transfer, etc.)
3. Vendor clicks "I've Paid"
4. System sets status to `'pending'`
5. Admin reviews and manually marks as `'paid'`

---

## Status Flow Diagrams

### Marketplace Billing Status
```
inactive → (vendor pays) → active ✓
inactive → (admin waives) → waived ✓
inactive → (vendor clicks "I've paid") → pending → (admin approves) → active ✓
```

### Event Fee Status
```
unpaid → (vendor pays) → paid ✓
unpaid → (admin waives) → waived ✓
unpaid → (vendor clicks "I've paid") → pending → (admin approves) → paid ✓
```

---

## Testing

### Test Case 1: Marketplace Publishing Guard
```typescript
// Active billing status - should allow
const vendor1 = { ...mockVendor, billingStatusMarketplace: 'active' };
expect(canPublishToMarketplace(vendor1).allowed).toBe(true);

// Waived billing status - should allow
const vendor2 = { ...mockVendor, billingStatusMarketplace: 'waived' };
expect(canPublishToMarketplace(vendor2).allowed).toBe(true);

// Inactive billing status - should block
const vendor3 = { ...mockVendor, billingStatusMarketplace: 'inactive' };
expect(canPublishToMarketplace(vendor3).allowed).toBe(false);

// Pending billing status - should block
const vendor4 = { ...mockVendor, billingStatusMarketplace: 'pending' };
expect(canPublishToMarketplace(vendor4).allowed).toBe(false);
```

### Test Case 2: Event Live Guard
```typescript
// Paid fee status - should allow
const eventVendor1 = { ...mockEventVendor, feeStatus: 'paid' };
expect(canGoLiveInEvent(eventVendor1).allowed).toBe(true);

// Waived fee status - should allow
const eventVendor2 = { ...mockEventVendor, feeStatus: 'waived' };
expect(canGoLiveInEvent(eventVendor2).allowed).toBe(true);

// Unpaid fee status - should block
const eventVendor3 = { ...mockEventVendor, feeStatus: 'unpaid' };
expect(canGoLiveInEvent(eventVendor3).allowed).toBe(false);

// Pending fee status - should block
const eventVendor4 = { ...mockEventVendor, feeStatus: 'pending' };
expect(canGoLiveInEvent(eventVendor4).allowed).toBe(false);
```

---

## Important Notes

1. **Shoppers are never blocked**: These guards only apply to vendor actions (publishing, going live). Shoppers can always browse the marketplace and events.

2. **Admin override**: Admins can set billing status to 'waived' to bypass payment requirements for specific vendors or events.

3. **Pending state**: When using external payment providers, the 'pending' state indicates that the vendor has marked payment as complete but admin approval is required.

4. **Event participation**: Vendors can join events and configure their booth even with unpaid fees. The guard only blocks setting live status during the event.

5. **Marketplace visibility**: If marketplace billing is not active/waived, the vendor's booth should not appear in the public marketplace. This should be enforced at the query/display level, not just the publishing action.
