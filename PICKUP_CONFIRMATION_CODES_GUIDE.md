# Pickup Confirmation Codes - Implementation Guide

## Overview
The Pickup Confirmation Codes system provides secure order verification for local pickup transactions in Overboard Market. Each pickup order receives a unique 6-digit code that customers share with vendors during pickup.

## How It Works

### Code Generation
- **Automatic**: Codes are auto-generated when an order with `is_local_pickup = true` is created
- **Format**: 6-digit numeric code (e.g., "847325")
- **Uniqueness**: Guaranteed unique among active orders within 30 days
- **Storage**: Stored in `orders.pickup_confirmation_code` with generation timestamp

### Customer Experience
1. Customer completes a local pickup order
2. System generates unique 6-digit code
3. Customer sees code in order details with:
   - Large, easy-to-read display
   - Safety instructions
   - Pickup workflow guidance
4. Customer shares code with vendor at pickup location

### Vendor Experience
1. Vendor navigates to order details
2. Clicks "Verify Pickup Code" button
3. Enters 6-digit code provided by customer
4. System validates code and marks order as picked up
5. Confirmation recorded with timestamp and vendor ID

## Database Schema

### New Columns in `orders` Table
```sql
pickup_confirmation_code      TEXT      -- 6-digit numeric code
pickup_code_generated_at      TIMESTAMP -- When code was created
pickup_code_verified_at       TIMESTAMP -- When code was verified
pickup_code_verified_by       TEXT      -- Vendor ID who verified
```

### Indexes
- `idx_orders_pickup_code` - For fast code lookups

### Functions
- `generate_pickup_code()` - Creates unique 6-digit code
- `set_pickup_code()` - Trigger to auto-generate on order creation
- `verify_pickup_code()` - Validates and records code verification

## Components

### PickupCodeDisplay
**Location**: `app/components/PickupCodeDisplay.tsx`

Displays the confirmation code for customers:
- Large, readable code display
- Safety warnings
- Pickup instructions
- Completion status indicator

### VerifyPickupCodeModal
**Location**: `app/components/VerifyPickupCodeModal.tsx`

Modal for vendors to verify pickup:
- 6-digit input field (numeric only)
- Real-time validation
- Safety reminders
- Success/error feedback

## API Methods

### OrdersContext Methods

#### `verifyPickupCode(orderId, code, vendorId)`
Verifies a pickup code and marks order as picked up.

**Parameters**:
- `orderId`: Order UUID
- `code`: 6-digit confirmation code
- `vendorId`: Vendor ID performing verification

**Returns**: `{ success: boolean; message: string }`

**Example**:
```typescript
const result = await verifyPickupCode(order.id, "847325", vendor.id);
if (result.success) {
  // Code verified successfully
} else {
  // Show error: result.message
}
```

## Security Features

1. **Code Uniqueness**: Collision-free generation within 30-day window
2. **One-Time Use**: Code becomes invalid after verification
3. **Order Validation**: Checks order status and pickup eligibility
4. **Audit Trail**: Records who verified and when
5. **Privacy**: Code only shown to customer, never to vendor until presented

## Safety Guidelines

### For Customers
- Only share code at verified pickup location
- Verify vendor identity before sharing
- Don't share code via messages or screenshots
- Report if vendor requests code before meetup

### For Vendors
- Request code only during in-person pickup
- Verify customer identity
- Use public meeting locations when possible
- Mark pickup complete only after code verification

## Integration Points

### Order Creation
When `is_local_pickup = true`, code generation is automatic via database trigger.

### Order Details Page
- Customer view: Shows `PickupCodeDisplay` component
- Vendor view: Shows "Verify Pickup Code" button
- Both views update when status changes to "picked_up"

### Shipping Status Updates
Verification automatically updates:
- `shipping_status` → `'picked_up'`
- `delivered_at` → Current timestamp
- `delivery_confirmed_by` → `'Vendor'`

## Testing Checklist

- [ ] Code generates automatically for pickup orders
- [ ] Code displays correctly for customers
- [ ] Invalid code shows error message
- [ ] Valid code marks order as picked up
- [ ] Already picked-up orders show completion status
- [ ] Non-pickup orders don't show code UI
- [ ] Vendor can only verify pending pickup orders
- [ ] Code is unique across active orders

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   psql -d your_database -f app/utils/pickupCodesSchema.sql
   ```

2. **Verify Schema**:
   - Check `orders` table has new columns
   - Test `generate_pickup_code()` function
   - Confirm trigger is active

3. **Update Order Creation**:
   - Ensure `is_local_pickup` flag is set correctly
   - Code generation happens automatically

4. **Test Full Flow**:
   - Create pickup order → check code generated
   - View as customer → verify code displays
   - View as vendor → test code verification
   - Confirm status updates correctly

## Troubleshooting

### Code Not Generating
- Verify `is_local_pickup = true` on order
- Check trigger `trigger_set_pickup_code` exists
- Ensure function `generate_pickup_code()` is defined

### Verification Failing
- Confirm order status is not already "picked_up"
- Verify code matches exactly (no spaces)
- Check order is local pickup type
- Ensure vendor has proper permissions

### Code Not Displaying
- Check order has `pickup_confirmation_code` value
- Verify `is_local_pickup` flag is true
- Confirm order status allows code display

## Future Enhancements

Potential improvements:
- QR code generation for scanning
- SMS/push notification with code
- Expiration time for codes
- Code refresh/regeneration option
- Analytics dashboard for pickup stats
- Multi-item pickup batching
