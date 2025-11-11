-- Customer Authentication and Profile Schema
-- Run this SQL in your Supabase SQL Editor

-- Customers table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  wants_sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer saved carts
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

-- Customer favorite vendors
CREATE TABLE IF NOT EXISTS customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, vendor_id)
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- Policies for customers table
CREATE POLICY "Users can view their own profile"
  ON customers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON customers FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = id);

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

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_carts_updated_at
  BEFORE UPDATE ON customer_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create customer profile on signup
CREATE OR REPLACE FUNCTION handle_new_customer_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create customer profile if user_type is customer or not specified
  IF (NEW.raw_user_meta_data->>'user_type' IS NULL OR NEW.raw_user_meta_data->>'user_type' = 'customer') THEN
    INSERT INTO public.customers (id, name, email, phone, wants_sms_notifications)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
      COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
      NEW.raw_user_meta_data->>'phone',
      COALESCE((NEW.raw_user_meta_data->>'wants_sms_notifications')::boolean, false)
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;

-- Trigger to create customer profile automatically
CREATE TRIGGER on_auth_user_created_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_customer_user();

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin can view all admin users
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Vendors Table
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
  status TEXT DEFAULT 'pending', -- pending, active, suspended
  marketplace_fee_override DECIMAL(10, 2),
  event_fee_override DECIMAL(10, 2),
  billing_status TEXT DEFAULT 'unpaid', -- paid, unpaid, overdue
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  images TEXT[], -- Array of image URLs
  video_url TEXT,
  inventory_count INTEGER DEFAULT 0,
  etsy_listing_url TEXT,
  status TEXT DEFAULT 'active', -- active, inactive, out_of_stock
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies for vendors table
CREATE POLICY "Admins can view all vendors"
  ON vendors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can update vendors"
  ON vendors FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can delete vendors"
  ON vendors FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Vendors can view their own data"
  ON vendors FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Vendors can update their own data"
  ON vendors FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Policies for products table
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Vendors can manage their own products"
  ON products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = products.vendor_id AND vendors.auth_user_id = auth.uid()
  ));

-- Triggers for updated_at
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
