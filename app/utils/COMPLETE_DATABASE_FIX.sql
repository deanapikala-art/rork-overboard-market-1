-- ============================================================================
-- COMPLETE DATABASE FIX FOR ALL AUTHENTICATION ISSUES
-- This script fixes customer, vendor, AND admin authentication
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- CLEANUP: Remove all existing policies, triggers, and functions
-- ============================================================================

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_vendor ON auth.users;

-- Drop all triggers on public tables
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_customer_carts_updated_at ON customer_carts;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_customer_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_admin_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_vendor_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 1: Create/Recreate all tables with proper structure
-- ============================================================================

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  wants_sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors table
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

-- Products table
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

-- Customer carts table
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

-- Customer favorites table
CREATE TABLE IF NOT EXISTS customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, vendor_id)
);

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Grant necessary permissions FIRST (before creating policies)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_carts TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_favorites TO anon, authenticated, service_role;

-- ============================================================================
-- STEP 3: Create RLS Policies (in correct order)
-- ============================================================================

-- === CUSTOMERS POLICIES ===
CREATE POLICY "Service role can manage customers"
  ON customers FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own customer profile"
  ON customers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own customer profile"
  ON customers FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own customer profile"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = id);

-- === ADMIN USERS POLICIES ===
CREATE POLICY "Service role can manage admin_users"
  ON admin_users FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- === VENDORS POLICIES ===
CREATE POLICY "Service role can manage vendors"
  ON vendors FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view active vendors"
  ON vendors FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can view all vendors"
  ON vendors FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can update vendors"
  ON vendors FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Vendors can view their own data"
  ON vendors FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Vendors can update their own data"
  ON vendors FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- === PRODUCTS POLICIES ===
CREATE POLICY "Service role can manage products"
  ON products FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Vendors can manage their own products"
  ON products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vendors 
    WHERE vendors.id = products.vendor_id 
    AND vendors.auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- === CUSTOMER CARTS POLICIES ===
CREATE POLICY "Service role can manage carts"
  ON customer_carts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage their own carts"
  ON customer_carts FOR ALL
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- === CUSTOMER FAVORITES POLICIES ===
CREATE POLICY "Service role can manage favorites"
  ON customer_favorites FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage their own favorites"
  ON customer_favorites FOR ALL
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- ============================================================================
-- STEP 4: Create utility functions
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Create trigger functions with proper error handling
-- ============================================================================

-- Customer signup trigger
CREATE OR REPLACE FUNCTION handle_new_customer_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  user_phone TEXT;
  user_wants_sms BOOLEAN;
  user_type TEXT;
BEGIN
  -- Extract user type
  user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- Log execution
  RAISE LOG 'Customer trigger: user_id=%, user_type=%', NEW.id, user_type;
  
  -- Only create customer profile if user_type is 'customer' or NULL
  IF user_type IS NOT NULL AND user_type != 'customer' THEN
    RAISE LOG 'Skipping customer profile - user_type is: %', user_type;
    RETURN NEW;
  END IF;
  
  -- Check if customer already exists
  IF EXISTS (SELECT 1 FROM public.customers WHERE id = NEW.id) THEN
    RAISE LOG 'Customer profile already exists for user: %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Extract and validate fields
  user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
  IF user_email IS NULL OR user_email = '' THEN
    RAISE WARNING 'Cannot create customer profile - email is missing for user: %', NEW.id;
    RETURN NEW;
  END IF;
  
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_wants_sms := COALESCE((NEW.raw_user_meta_data->>'wants_sms_notifications')::boolean, false);
  
  -- Insert customer profile
  INSERT INTO public.customers (id, name, email, phone, wants_sms_notifications)
  VALUES (NEW.id, user_name, user_email, user_phone, user_wants_sms)
  ON CONFLICT (id) DO NOTHING;
  
  RAISE LOG 'Customer profile created for user: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_customer_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin signup trigger
CREATE OR REPLACE FUNCTION handle_new_admin_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_type TEXT;
BEGIN
  user_type := NEW.raw_user_meta_data->>'user_type';
  
  RAISE LOG 'Admin trigger: user_id=%, user_type=%', NEW.id, user_type;
  
  -- Only create admin profile if user_type is 'admin'
  IF user_type != 'admin' THEN
    RAISE LOG 'Skipping admin profile - user_type is: %', user_type;
    RETURN NEW;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE id = NEW.id) THEN
    RAISE LOG 'Admin profile already exists for user: %', NEW.id;
    RETURN NEW;
  END IF;
  
  user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
  IF user_email IS NULL OR user_email = '' THEN
    RAISE WARNING 'Cannot create admin profile - email is missing for user: %', NEW.id;
    RETURN NEW;
  END IF;
  
  INSERT INTO public.admin_users (id, email, full_name)
  VALUES (
    NEW.id, 
    user_email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE LOG 'Admin profile created for user: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_admin_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vendor signup trigger
CREATE OR REPLACE FUNCTION handle_new_vendor_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_type TEXT;
  business_name TEXT;
BEGIN
  user_type := NEW.raw_user_meta_data->>'user_type';
  
  RAISE LOG 'Vendor trigger: user_id=%, user_type=%', NEW.id, user_type;
  
  -- Only create vendor profile if user_type is 'vendor'
  IF user_type != 'vendor' THEN
    RAISE LOG 'Skipping vendor profile - user_type is: %', user_type;
    RETURN NEW;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.vendors WHERE auth_user_id = NEW.id) THEN
    RAISE LOG 'Vendor profile already exists for user: %', NEW.id;
    RETURN NEW;
  END IF;
  
  user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
  IF user_email IS NULL OR user_email = '' THEN
    RAISE WARNING 'Cannot create vendor profile - email is missing for user: %', NEW.id;
    RETURN NEW;
  END IF;
  
  business_name := COALESCE(NEW.raw_user_meta_data->>'business_name', 'Vendor Business');
  
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
    user_email,
    business_name,
    NEW.raw_user_meta_data->>'contact_name',
    NEW.raw_user_meta_data->>'phone',
    'pending'
  )
  ON CONFLICT (email) DO NOTHING;
  
  RAISE LOG 'Vendor profile created for user: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_vendor_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Create all triggers
-- ============================================================================

-- Triggers for auth.users
CREATE TRIGGER on_auth_user_created_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_customer_user();

CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_admin_user();

CREATE TRIGGER on_auth_user_created_vendor
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_vendor_user();

-- Triggers for updated_at columns
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
-- STEP 7: Verification queries
-- ============================================================================

-- Check all policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check all triggers on auth.users
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
AND tgname LIKE '%auth_user_created%';

-- Check table grants
SELECT table_name, grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'admin_users', 'vendors', 'products')
ORDER BY table_name, grantee;

-- ============================================================================
-- DONE! All database issues should be resolved
-- ============================================================================
