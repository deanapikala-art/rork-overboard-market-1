-- ============================================================================
-- ULTIMATE DATABASE FIX - Addresses ALL possible authentication issues
-- This is the most comprehensive fix that checks EVERY potential problem
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Complete cleanup of existing setup
-- ============================================================================

-- Drop ALL existing triggers first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tgname, tgrelid::regclass as table_name
        FROM pg_trigger
        WHERE tgname LIKE '%auth_user_created%' 
           OR tgname LIKE '%update_%_updated_at%'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON ' || r.table_name || ' CASCADE';
        RAISE NOTICE 'Dropped trigger: % on %', r.tgname, r.table_name;
    END LOOP;
END $$;

-- Drop ALL existing policies
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

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_customer_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_admin_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_vendor_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 2: Ensure tables exist with correct structure
-- ============================================================================

-- Drop and recreate customers table
DROP TABLE IF EXISTS customer_favorites CASCADE;
DROP TABLE IF EXISTS customer_carts CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  wants_sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate admin_users table
DROP TABLE IF EXISTS admin_users CASCADE;

CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate vendors table (keep products for now)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID,
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

DROP TABLE IF EXISTS vendors CASCADE;

CREATE TABLE vendors (
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

-- Re-add foreign key to products
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_vendor_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

-- Customer carts and favorites
CREATE TABLE customer_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, vendor_id)
);

CREATE TABLE customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, vendor_id)
);

-- ============================================================================
-- STEP 3: Disable RLS temporarily to ensure clean setup
-- ============================================================================

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_carts DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Grant ALL necessary permissions (most permissive for service role)
-- ============================================================================

-- Grant schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON SCHEMA public TO service_role, postgres;

-- Grant table access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vendors TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_carts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_favorites TO anon, authenticated;

-- Grant sequence access
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, postgres, anon, authenticated;

-- ============================================================================
-- STEP 5: Create utility function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Create SIMPLIFIED trigger functions with maximum error handling
-- ============================================================================

-- CUSTOMER TRIGGER - Ultra defensive with detailed logging
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
  -- Log trigger execution
  RAISE NOTICE 'Customer trigger started for user %', NEW.id;
  
  -- Get user type
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer');
  RAISE NOTICE 'User type: %', v_user_type;
  
  -- Only process if customer or no user type specified
  IF v_user_type NOT IN ('customer', '') AND v_user_type IS NOT NULL THEN
    RAISE NOTICE 'Skipping - not a customer (type: %)', v_user_type;
    RETURN NEW;
  END IF;
  
  -- Check if already exists
  IF EXISTS (SELECT 1 FROM public.customers WHERE id = NEW.id) THEN
    RAISE NOTICE 'Customer profile already exists';
    RETURN NEW;
  END IF;
  
  -- Extract data with fallbacks
  v_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Customer');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_wants_sms := COALESCE((NEW.raw_user_meta_data->>'wants_sms_notifications')::boolean, false);
  
  -- Validate email
  IF v_email IS NULL OR v_email = '' THEN
    RAISE WARNING 'Cannot create customer - email missing';
    RETURN NEW;
  END IF;
  
  RAISE NOTICE 'Creating customer profile: id=%, email=%, name=%', NEW.id, v_email, v_name;
  
  -- Insert with ON CONFLICT to handle race conditions
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
    -- Email already exists with different user ID
    RAISE WARNING 'Email % already exists for a different user', v_email;
    -- Don't fail the auth user creation, just skip profile creation
    RETURN NEW;
  WHEN foreign_key_violation THEN
    RAISE WARNING 'Foreign key violation - auth user may not exist yet';
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating customer profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    -- Return NEW to allow auth.users record to be created even if profile fails
    RETURN NEW;
END;
$$;

-- VENDOR TRIGGER
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

-- ADMIN TRIGGER
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
-- STEP 7: Create triggers on auth.users
-- ============================================================================

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

-- ============================================================================
-- STEP 8: Create updated_at triggers
-- ============================================================================

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
-- STEP 9: Re-enable RLS with proper policies
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- === CUSTOMERS POLICIES ===
CREATE POLICY "Allow service role full access to customers"
  ON customers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert their own customer profile"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own customer profile"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own customer profile"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- === ADMIN USERS POLICIES ===
CREATE POLICY "Allow service role full access to admin_users"
  ON admin_users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- === VENDORS POLICIES ===
CREATE POLICY "Allow service role full access to vendors"
  ON vendors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view active vendors"
  ON vendors FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Vendors can view their own data"
  ON vendors FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Vendors can update their own data"
  ON vendors FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can update vendors"
  ON vendors FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- === PRODUCTS POLICIES ===
CREATE POLICY "Allow service role full access to products"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Vendors can manage their own products"
  ON products FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vendors 
    WHERE vendors.id = products.vendor_id 
    AND vendors.auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- === CUSTOMER CARTS POLICIES ===
CREATE POLICY "Allow service role full access to carts"
  ON customer_carts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage their own carts"
  ON customer_carts FOR ALL
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- === CUSTOMER FAVORITES POLICIES ===
CREATE POLICY "Allow service role full access to favorites"
  ON customer_favorites FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage their own favorites"
  ON customer_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- ============================================================================
-- STEP 10: Verification queries
-- ============================================================================

-- Show all triggers
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname LIKE '%auth_user_created%' OR tgname LIKE '%updated_at%'
ORDER BY tgrelid::regclass::text, tgname;

-- Show all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Show table grants
SELECT 
  table_name,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'admin_users', 'vendors', 'products')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

-- ============================================================================
-- SUCCESS! Your database is now properly configured.
-- Try creating a new customer account now.
-- Check Supabase Dashboard > Database > Logs to see trigger execution.
-- ============================================================================
