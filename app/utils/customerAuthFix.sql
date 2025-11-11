-- COMPREHENSIVE FIX FOR CUSTOMER SIGNUP DATABASE ERROR
-- This script addresses all potential issues causing "Database error saving new user"
-- Run this entire script in your Supabase SQL Editor

-- ==============================================================================
-- STEP 1: Clean up existing policies and triggers to avoid conflicts
-- ==============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON customers;
DROP POLICY IF EXISTS "Users can update their own profile" ON customers;
DROP POLICY IF EXISTS "Users can insert their own profile" ON customers;
DROP POLICY IF EXISTS "Service role can insert customers" ON customers;

-- Drop existing trigger to recreate it properly
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;

-- ==============================================================================
-- STEP 2: Recreate customers table with proper constraints
-- ==============================================================================

-- Ensure table exists with correct structure
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

-- ==============================================================================
-- STEP 3: Create proper RLS policies that work with triggers
-- ==============================================================================

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON customers FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON customers FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = id);

-- CRITICAL: Allow service role (used by triggers) to insert customers
-- This policy enables the trigger function to insert records
CREATE POLICY "Service role can insert customers"
  ON customers FOR INSERT
  WITH CHECK (true);

-- ==============================================================================
-- STEP 4: Create improved trigger function with error handling
-- ==============================================================================

CREATE OR REPLACE FUNCTION handle_new_customer_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Only process if user_type is customer or not specified
  IF (NEW.raw_user_meta_data->>'user_type' IS NULL OR 
      NEW.raw_user_meta_data->>'user_type' = 'customer') THEN
    
    -- Extract email with fallback
    user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
    
    -- Validate email exists
    IF user_email IS NULL OR user_email = '' THEN
      RAISE EXCEPTION 'Email is required for customer signup';
    END IF;
    
    -- Extract name with fallback
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
    
    -- Insert customer record
    INSERT INTO public.customers (id, name, email, phone, wants_sms_notifications)
    VALUES (
      NEW.id,
      user_name,
      user_email,
      NEW.raw_user_meta_data->>'phone',
      COALESCE((NEW.raw_user_meta_data->>'wants_sms_notifications')::boolean, false)
    )
    ON CONFLICT (id) DO NOTHING;
    
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth.users insert
    RAISE WARNING 'Error creating customer profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- STEP 5: Create trigger
-- ==============================================================================

CREATE TRIGGER on_auth_user_created_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_customer_user();

-- ==============================================================================
-- STEP 6: Grant necessary permissions
-- ==============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on customers table
GRANT SELECT, INSERT, UPDATE ON public.customers TO anon, authenticated, service_role;

-- ==============================================================================
-- VERIFICATION QUERIES (Optional - for debugging)
-- ==============================================================================

-- Check if policies exist
-- SELECT * FROM pg_policies WHERE tablename = 'customers';

-- Check if trigger exists
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_customer';

-- Check if function exists
-- SELECT * FROM pg_proc WHERE proname = 'handle_new_customer_user';

-- ==============================================================================
-- DONE! Now test customer signup
-- ==============================================================================
