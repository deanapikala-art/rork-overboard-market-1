-- =====================================================================
-- VENDOR SALES & PROMOTIONS SYSTEM
-- =====================================================================

-- Create enums for discount types and applies-to scopes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
    CREATE TYPE discount_type AS ENUM ('percentage', 'flat', 'bogo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applies_to_scope') THEN
    CREATE TYPE applies_to_scope AS ENUM ('storewide', 'category', 'product');
  END IF;
END $$;

-- Create VendorSales table
CREATE TABLE IF NOT EXISTS public.vendor_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  discount_type discount_type NOT NULL,
  discount_value numeric(10,2),
  buy_qty int,
  get_qty int,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT false,
  applies_to applies_to_scope NOT NULL DEFAULT 'storewide',
  product_ids uuid[],
  category text,
  banner_image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_vendor_sales_vendor
    FOREIGN KEY (vendor_id) 
    REFERENCES public.vendor_profiles(id)
    ON DELETE CASCADE,
    
  CONSTRAINT valid_dates
    CHECK (end_date > start_date),
    
  CONSTRAINT valid_discount_value
    CHECK (
      (discount_type = 'percentage' AND discount_value > 0 AND discount_value <= 100)
      OR (discount_type = 'flat' AND discount_value > 0)
      OR (discount_type = 'bogo')
    ),
    
  CONSTRAINT valid_bogo
    CHECK (
      (discount_type = 'bogo' AND buy_qty > 0 AND get_qty > 0)
      OR (discount_type != 'bogo')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_sales_vendor ON public.vendor_sales(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_sales_active ON public.vendor_sales(active);
CREATE INDEX IF NOT EXISTS idx_vendor_sales_dates ON public.vendor_sales(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vendor_sales_product_ids ON public.vendor_sales USING GIN(product_ids);

-- Enable RLS
ALTER TABLE public.vendor_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Everyone can view active sales
DROP POLICY IF EXISTS sales_select_active ON public.vendor_sales;
CREATE POLICY sales_select_active ON public.vendor_sales
  FOR SELECT
  USING (true);

-- Vendors can insert their own sales
DROP POLICY IF EXISTS sales_insert ON public.vendor_sales;
CREATE POLICY sales_insert ON public.vendor_sales
  FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT v.id 
      FROM public.vendor_profiles v
      JOIN public.user_profile u ON u.id = v.owner_user_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Vendors can update their own sales
DROP POLICY IF EXISTS sales_update ON public.vendor_sales;
CREATE POLICY sales_update ON public.vendor_sales
  FOR UPDATE
  USING (
    vendor_id IN (
      SELECT v.id 
      FROM public.vendor_profiles v
      JOIN public.user_profile u ON u.id = v.owner_user_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Vendors can delete their own sales
DROP POLICY IF EXISTS sales_delete ON public.vendor_sales;
CREATE POLICY sales_delete ON public.vendor_sales
  FOR DELETE
  USING (
    vendor_id IN (
      SELECT v.id 
      FROM public.vendor_profiles v
      JOIN public.user_profile u ON u.id = v.owner_user_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- =====================================================================
-- FUNCTION: Auto-update active status based on current time
-- =====================================================================

CREATE OR REPLACE FUNCTION public.update_vendor_sales_active_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.vendor_sales
  SET active = (now() BETWEEN start_date AND end_date),
      updated_at = now()
  WHERE active != (now() BETWEEN start_date AND end_date);
END;
$$;

-- =====================================================================
-- TRIGGER: Auto-set active status on insert/update
-- =====================================================================

CREATE OR REPLACE FUNCTION public.set_vendor_sale_active_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.active := (now() BETWEEN NEW.start_date AND NEW.end_date);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_sale_active ON public.vendor_sales;
CREATE TRIGGER trg_set_sale_active
  BEFORE INSERT OR UPDATE ON public.vendor_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vendor_sale_active_status();

-- =====================================================================
-- HELPER FUNCTION: Get active sales for a product
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_active_sales_for_product(p_product_id uuid)
RETURNS TABLE (
  sale_id uuid,
  vendor_id uuid,
  title text,
  discount_type discount_type,
  discount_value numeric,
  buy_qty int,
  get_qty int
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vs.id,
    vs.vendor_id,
    vs.title,
    vs.discount_type,
    vs.discount_value,
    vs.buy_qty,
    vs.get_qty
  FROM public.vendor_sales vs
  WHERE vs.active = true
    AND (
      vs.applies_to = 'storewide'
      OR (vs.applies_to = 'product' AND p_product_id = ANY(vs.product_ids))
    )
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = p_product_id AND p.vendor_id = vs.vendor_id
    );
END;
$$;

-- =====================================================================
-- HELPER FUNCTION: Calculate sale price for a product
-- =====================================================================

CREATE OR REPLACE FUNCTION public.calculate_sale_price(
  p_original_price_cents int,
  p_discount_type discount_type,
  p_discount_value numeric
)
RETURNS int
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_sale_price int;
BEGIN
  IF p_discount_type = 'percentage' THEN
    v_sale_price := FLOOR(p_original_price_cents * (1 - p_discount_value / 100.0));
  ELSIF p_discount_type = 'flat' THEN
    v_sale_price := GREATEST(0, p_original_price_cents - (p_discount_value * 100)::int);
  ELSE
    v_sale_price := p_original_price_cents;
  END IF;
  
  RETURN v_sale_price;
END;
$$;

-- =====================================================================
-- COMPLETE
-- =====================================================================

COMMENT ON TABLE public.vendor_sales IS 'Vendor-created sales and promotions outside of live market events';
COMMENT ON FUNCTION public.update_vendor_sales_active_status() IS 'Call this daily via cron to auto-expire sales';
COMMENT ON FUNCTION public.get_active_sales_for_product(uuid) IS 'Returns all active sales that apply to a given product';
COMMENT ON FUNCTION public.calculate_sale_price(int, discount_type, numeric) IS 'Calculates discounted price based on sale type';
