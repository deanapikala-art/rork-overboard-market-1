-- Customer Saved for Later Schema
-- Run this SQL in your Supabase SQL Editor

-- Customer saved for later items
CREATE TABLE IF NOT EXISTS customer_saved_for_later (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product JSONB NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  customizations JSONB,
  requires_proof BOOLEAN DEFAULT false,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE customer_saved_for_later ENABLE ROW LEVEL SECURITY;

-- Policies for customer_saved_for_later table
CREATE POLICY "Users can view their own saved items"
  ON customer_saved_for_later FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own saved items"
  ON customer_saved_for_later FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own saved items"
  ON customer_saved_for_later FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own saved items"
  ON customer_saved_for_later FOR DELETE
  USING (auth.uid() = customer_id);

-- Trigger for updated_at
CREATE TRIGGER update_customer_saved_for_later_updated_at
  BEFORE UPDATE ON customer_saved_for_later
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_customer_saved_for_later_customer_id 
  ON customer_saved_for_later(customer_id);
