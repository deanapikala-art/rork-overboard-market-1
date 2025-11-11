-- ============================================================================
-- FINAL COMPREHENSIVE FIX - Addresses ALL database issues
-- This fixes:
-- 1. Missing customer_carts and customer_favorites tables
-- 2. Infinite recursion in admin_users RLS policies
-- 3. All authentication and schema cache issues
-- 
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop all existing policies that might cause recursion
-- ============================================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped policy: % on %', r.policyname, r.tablename;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Ensure all tables exist
-- ============================================================================

-- Create customers table if missing
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  wants_sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table if missing
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendors table if missing
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  specialty TEXT,
  description TEXT,
  location TEXT,
  avatar TEXT,
  website_url TEXT,
  instagram_handle TEXT,
  status TEXT DEFAULT 'pending',
  marketplace_fee_override DECIMAL(10, 2),
  event_fee_override DECIMAL(10, 2),
  billing_status TEXT DEFAULT 'unpaid',
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table if missing
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  images TEXT[],
  video_url TEXT,
  inventory_count INTEGER DEFAULT 0,
  etsy_listing_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_carts table (THIS WAS MISSING)
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

-- Create customer_favorites table (THIS WAS MISSING)
CREATE TABLE IF NOT EXISTS customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, vendor_id)
);

-- ============================================================================
-- STEP 3: Grant ALL necessary permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vendors TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_carts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_favorites TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, anon, authenticated;

-- ============================================================================
-- STEP 4: Enable RLS on all tables
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS policies WITHOUT infinite recursion
-- ============================================================================

-- === CUSTOMERS POLICIES ===
CREATE POLICY "service_role_customers_all"
  ON customers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_customers_insert_own"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "authenticated_customers_select_own"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "authenticated_customers_update_own"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "authenticated_customers_delete_own"
  ON customers FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- === ADMIN USERS POLICIES (FIXED - No recursion) ===
CREATE POLICY "service_role_admin_users_all"
  ON admin_users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to view their own admin record
CREATE POLICY "authenticated_admin_users_select_own"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own admin record
CREATE POLICY "authenticated_admin_users_insert_own"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own admin record
CREATE POLICY "authenticated_admin_users_update_own"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- === VENDORS POLICIES ===
CREATE POLICY "service_role_vendors_all"
  ON vendors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_vendors_select_active"
  ON vendors FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "authenticated_vendors_select_own"
  ON vendors FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "authenticated_vendors_update_own"
  ON vendors FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "authenticated_vendors_insert_own"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- === PRODUCTS POLICIES ===
CREATE POLICY "service_role_products_all"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_products_select_active"
  ON products FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "authenticated_products_all_own"
  ON products FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vendors 
    WHERE vendors.id = products.vendor_id 
    AND vendors.auth_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM vendors 
    WHERE vendors.id = products.vendor_id 
    AND vendors.auth_user_id = auth.uid()
  ));

-- === CUSTOMER CARTS POLICIES ===
CREATE POLICY "service_role_carts_all"
  ON customer_carts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_carts_all_own"
  ON customer_carts FOR ALL
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- === CUSTOMER FAVORITES POLICIES ===
CREATE POLICY "service_role_favorites_all"
  ON customer_favorites FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_favorites_all_own"
  ON customer_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- ============================================================================
-- STEP 6: Ensure trigger functions exist
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Customer trigger function
CREATE OR REPLACE FUNCTION handle_new_customer_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_type TEXT;
  v_email TEXT;
  v_name TEXT;
  v_phone TEXT;
  v_wants_sms BOOLEAN;
BEGIN
  RAISE NOTICE 'Customer trigger started for user %', NEW.id;
  
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer');
  
  IF v_user_type NOT IN ('customer', '') AND v_user_type IS NOT NULL THEN
    RAISE NOTICE 'Skipping - not a customer (type: %)', v_user_type;
    RETURN NEW;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.customers WHERE id = NEW.id) THEN
    RAISE NOTICE 'Customer profile already exists';
    RETURN NEW;
  END IF;
  
  v_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Customer');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_wants_sms := COALESCE((NEW.raw_user_meta_data->>'wants_sms_notifications')::boolean, false);
  
  IF v_email IS NULL OR v_email = '' THEN
    RAISE WARNING 'Cannot create customer - email missing';
    RETURN NEW;
  END IF;
  
  RAISE NOTICE 'Creating customer profile: id=%, email=%, name=%', NEW.id, v_email, v_name;
  
  INSERT INTO public.customers (id, name, email, phone, wants_sms_notifications)
  VALUES (NEW.id, v_name, v_email, v_phone, v_wants_sms)
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    wants_sms_notifications = EXCLUDED.wants_sms_notifications,
    updated_at = NOW();
  
  RAISE NOTICE 'Customer profile created successfully';
  RETURN NEW;
  
EXCEPTION 
  WHEN unique_violation THEN
    RAISE WARNING 'Email % already exists for a different user', v_email;
    RETURN NEW;
  WHEN foreign_key_violation THEN
    RAISE WARNING 'Foreign key violation - auth user may not exist yet';
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating customer profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Vendor trigger function
CREATE OR REPLACE FUNCTION handle_new_vendor_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_type TEXT;
  v_email TEXT;
  v_business_name TEXT;
BEGIN
  RAISE NOTICE 'Vendor trigger started for user %', NEW.id;
  
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  IF v_user_type != 'vendor' THEN
    RAISE NOTICE 'Skipping - not a vendor';
    RETURN NEW;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.vendors WHERE auth_user_id = NEW.id) THEN
    RAISE NOTICE 'Vendor profile already exists';
    RETURN NEW;
  END IF;
  
  v_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
  v_business_name := COALESCE(NEW.raw_user_meta_data->>'business_name', 'Vendor Business');
  
  IF v_email IS NULL OR v_email = '' THEN
    RAISE WARNING 'Cannot create vendor - email missing';
    RETURN NEW;
  END IF;
  
  RAISE NOTICE 'Creating vendor profile: auth_user_id=%, email=%', NEW.id, v_email;
  
  INSERT INTO public.vendors (
    auth_user_id, 
    email, 
    business_name,
    contact_name,
    phone,
    status
  )
  VALUES (
    NEW.id,
    v_email,
    v_business_name,
    NEW.raw_user_meta_data->>'contact_name',
    NEW.raw_user_meta_data->>'phone',
    'pending'
  )
  ON CONFLICT (email) DO UPDATE
  SET
    auth_user_id = EXCLUDED.auth_user_id,
    business_name = EXCLUDED.business_name,
    contact_name = EXCLUDED.contact_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();
  
  RAISE NOTICE 'Vendor profile created successfully';
  RETURN NEW;
  
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating vendor profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Admin trigger function
CREATE OR REPLACE FUNCTION handle_new_admin_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_type TEXT;
  v_email TEXT;
BEGIN
  RAISE NOTICE 'Admin trigger started for user %', NEW.id;
  
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  IF v_user_type != 'admin' THEN
    RAISE NOTICE 'Skipping - not an admin';
    RETURN NEW;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE id = NEW.id) THEN
    RAISE NOTICE 'Admin profile already exists';
    RETURN NEW;
  END IF;
  
  v_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
  
  IF v_email IS NULL OR v_email = '' THEN
    RAISE WARNING 'Cannot create admin - email missing';
    RETURN NEW;
  END IF;
  
  RAISE NOTICE 'Creating admin profile: id=%, email=%', NEW.id, v_email;
  
  INSERT INTO public.admin_users (id, email, full_name)
  VALUES (
    NEW.id,
    v_email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  
  RAISE NOTICE 'Admin profile created successfully';
  RETURN NEW;
  
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating admin profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 7: Ensure triggers exist (drop and recreate)
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_vendor ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;

CREATE TRIGGER on_auth_user_created_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_customer_user();

CREATE TRIGGER on_auth_user_created_vendor
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_vendor_user();

CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_admin_user();

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_customer_carts_updated_at ON customer_carts;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_carts_updated_at
  BEFORE UPDATE ON customer_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: Verification - Show what we've created
-- ============================================================================

-- Show all tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('customers', 'admin_users', 'vendors', 'products', 'customer_carts', 'customer_favorites')
ORDER BY table_name;

-- Show all policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Show all triggers
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname LIKE '%auth_user_created%' OR tgname LIKE '%updated_at%'
ORDER BY tgrelid::regclass::text, tgname;

-- ============================================================================
-- SUCCESS! 
-- All tables created, RLS policies fixed (no infinite recursion), 
-- and triggers configured properly.
-- 
-- Try creating a new customer/vendor/admin account now.
-- ============================================================================
