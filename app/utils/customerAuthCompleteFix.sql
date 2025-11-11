-- ============================================================================
-- COMPREHENSIVE CUSTOMER SIGNUP FIX
-- This script fixes ALL potential database issues causing signup errors
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Clean up ALL existing policies, triggers, and functions
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON customers;
DROP POLICY IF EXISTS "Users can update their own profile" ON customers;
DROP POLICY IF EXISTS "Users can insert their own profile" ON customers;
DROP POLICY IF EXISTS "Service role can insert customers" ON customers;
DROP POLICY IF EXISTS "Allow service role to insert" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customers;

DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;

DROP FUNCTION IF EXISTS handle_new_customer_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 2: Ensure customers table exists with proper structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  wants_sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create RLS policies (ORDER MATTERS!)
-- ============================================================================

-- Policy 1: Allow service role (triggers) to insert customers
-- THIS MUST BE FIRST - triggers use service role context
CREATE POLICY "Service role can insert customers"
  ON customers FOR INSERT
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON customers FOR SELECT
  USING (auth.uid() = id);

-- Policy 4: Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON customers FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- STEP 4: Grant necessary permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated, service_role;

-- ============================================================================
-- STEP 5: Create utility function for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: Create trigger function with comprehensive error handling
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_customer_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  user_phone TEXT;
  user_wants_sms BOOLEAN;
  existing_customer UUID;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Customer trigger fired for user: %', NEW.id;
  
  -- Only process if user_type is customer or not specified
  IF (NEW.raw_user_meta_data->>'user_type' IS NOT NULL AND 
      NEW.raw_user_meta_data->>'user_type' != 'customer') THEN
    RAISE LOG 'Skipping customer creation - user type is: %', NEW.raw_user_meta_data->>'user_type';
    RETURN NEW;
  END IF;
  
  -- Check if customer already exists (prevents duplicate inserts)
  SELECT id INTO existing_customer FROM public.customers WHERE id = NEW.id;
  IF existing_customer IS NOT NULL THEN
    RAISE LOG 'Customer already exists for user: %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Extract and validate email
  user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
  IF user_email IS NULL OR user_email = '' THEN
    RAISE EXCEPTION 'Email is required for customer signup';
  END IF;
  
  -- Extract other fields with proper defaults
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_wants_sms := COALESCE((NEW.raw_user_meta_data->>'wants_sms_notifications')::boolean, false);
  
  -- Insert customer record
  INSERT INTO public.customers (id, name, email, phone, wants_sms_notifications)
  VALUES (
    NEW.id,
    user_name,
    user_email,
    user_phone,
    user_wants_sms
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    wants_sms_notifications = EXCLUDED.wants_sms_notifications,
    updated_at = NOW();
  
  RAISE LOG 'Customer profile created successfully for user: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE LOG 'Unique constraint violation for user: %, email: %', NEW.id, user_email;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating customer profile for user %: % - %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Create triggers
-- ============================================================================

CREATE TRIGGER on_auth_user_created_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_customer_user();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: Verify setup (check these results)
-- ============================================================================

-- Check policies (should see 4 policies)
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'customers'
ORDER BY policyname;

-- Check triggers (should see 2 triggers)
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'customers'::regclass;

-- Check grants
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'customers';

-- ============================================================================
-- DONE! Test customer signup now
-- ============================================================================

-- To test trigger manually:
-- SELECT handle_new_customer_user();

-- To check if a user has a customer profile:
-- SELECT * FROM customers WHERE email = 'test@example.com';

-- To view trigger logs (run after signup attempt):
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%handle_new_customer%';
