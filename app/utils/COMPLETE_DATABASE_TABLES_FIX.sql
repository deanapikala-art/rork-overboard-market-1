-- COMPREHENSIVE DATABASE FIX
-- This SQL fixes all missing tables and policy issues
-- Run this in your Supabase SQL Editor

-- ============================================
-- PART 1: Drop problematic policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can update vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can delete vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- ============================================
-- PART 2: Create missing tables
-- ============================================

-- Customer saved carts (if not exists)
CREATE TABLE IF NOT EXISTS customer_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, vendor_id)
);

-- Customer favorite vendors (if not exists)
CREATE TABLE IF NOT EXISTS customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, vendor_id)
);

-- ============================================
-- PART 3: Enable Row Level Security
-- ============================================

ALTER TABLE customer_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 4: Create proper policies for customer tables
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own carts" ON customer_carts;
DROP POLICY IF EXISTS "Users can insert their own carts" ON customer_carts;
DROP POLICY IF EXISTS "Users can update their own carts" ON customer_carts;
DROP POLICY IF EXISTS "Users can delete their own carts" ON customer_carts;
DROP POLICY IF EXISTS "Users can view their own favorites" ON customer_favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON customer_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON customer_favorites;

-- Policies for customer_carts table
CREATE POLICY "Users can view their own carts"
  ON customer_carts FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own carts"
  ON customer_carts FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own carts"
  ON customer_carts FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own carts"
  ON customer_carts FOR DELETE
  USING (auth.uid() = customer_id);

-- Policies for customer_favorites table
CREATE POLICY "Users can view their own favorites"
  ON customer_favorites FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own favorites"
  ON customer_favorites FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own favorites"
  ON customer_favorites FOR DELETE
  USING (auth.uid() = customer_id);

-- ============================================
-- PART 5: Fix admin_users policies (no recursion)
-- ============================================

-- Simple policy: allow all authenticated users to read admin_users
-- The app logic will handle checking if they're actually an admin
CREATE POLICY "Allow authenticated users to read admin_users"
  ON admin_users FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only allow admins to insert/update (using a separate admin check)
-- For now, we'll allow service role only for modifications
-- You can modify this later based on your needs

-- ============================================
-- PART 6: Recreate vendor and product policies without recursion
-- ============================================

-- Public can view all vendors (for marketplace)
CREATE POLICY "Public can view all vendors"
  ON vendors FOR SELECT
  USING (true);

-- Vendors can update their own data
CREATE POLICY "Vendors can update their own data"
  ON vendors FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Public can view active products
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (status = 'active');

-- Vendors can manage their own products
CREATE POLICY "Vendors can manage their own products"
  ON products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = products.vendor_id AND vendors.auth_user_id = auth.uid()
  ));

-- ============================================
-- PART 7: Create triggers for updated_at
-- ============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_customer_carts_updated_at ON customer_carts;

-- Create trigger for customer_carts
CREATE TRIGGER update_customer_carts_updated_at
  BEFORE UPDATE ON customer_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 8: Grant necessary permissions
-- ============================================

-- Grant permissions to authenticated users
GRANT ALL ON customer_carts TO authenticated;
GRANT ALL ON customer_favorites TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON vendors TO authenticated, anon;
GRANT SELECT ON products TO authenticated, anon;

-- ============================================
-- COMPLETE!
-- ============================================
-- After running this SQL:
-- 1. Refresh your Supabase schema cache (Settings -> API -> Refresh)
-- 2. Test customer sign up
-- 3. Test adding items to cart
-- 4. Test adding favorites
-- 5. Test admin login
