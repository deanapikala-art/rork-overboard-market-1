# Fix User Orders Table Name Issue

## Problem
The application code references `user_orders` table but the database has `orders` table instead.

## Solution Options

### Option 1: Rename the database table (Recommended if data exists)
If you already have data in an `orders` table, run this SQL:

```sql
-- Rename existing table
ALTER TABLE orders RENAME TO user_orders;

-- Update indexes
ALTER INDEX IF EXISTS idx_orders_customer_id RENAME TO idx_user_orders_customer_id;
ALTER INDEX IF EXISTS idx_orders_vendor_id RENAME TO idx_user_orders_vendor_id;
ALTER INDEX IF EXISTS idx_orders_status RENAME TO idx_user_orders_status;
ALTER INDEX IF EXISTS idx_orders_order_number RENAME TO idx_user_orders_order_number;
ALTER INDEX IF EXISTS idx_orders_created_at RENAME TO idx_user_orders_created_at;
```

### Option 2: Create the user_orders table from scratch
If the table doesn't exist at all, run the complete schema from `app/utils/ordersSchema.sql`.

### Option 3: Update all code references (Alternative approach)
If you prefer to keep the table named `orders`, the code would need to be updated in multiple files to use `orders` instead of `user_orders`.

## Verification
After applying the fix, verify with:

```sql
SELECT * FROM user_orders LIMIT 1;
```

## Files affected by this issue
- `app/contexts/OrdersContext.tsx` - All queries reference `user_orders`
- `app/utils/deliveryTracking.ts` - Queries reference `user_orders`
- Any other contexts or utilities that query orders

## Recommended Action
Run Option 1 if you have existing data, or Option 2 if starting fresh.
