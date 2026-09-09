-- ==============================================================================
-- 🛒 KINTESI E-COMMERCE - COUPONS & SOLO MERCHANT DATABASE MIGRATION
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jhewkxwfujkigvbmybry/sql/new
--
-- Features:
-- 1. Creates `coupons` table for promo code management
-- 2. Creates `coupon_usages` table to strictly enforce 1 use per customer
-- 3. Enables Row Level Security (RLS) policies
-- 4. Removes multi-vendor seller payment columns (Single store merchant lock)
-- 5. Inserts default KINTESI10 7-day new customer welcome coupon
-- ==============================================================================

-- 1. SINGLE MERCHANT SECURITY LOCK (Drop multi-vendor seller payment fields)
ALTER TABLE public.products DROP COLUMN IF EXISTS seller_payment;
ALTER TABLE public.orders DROP COLUMN IF EXISTS seller_payment_snapshot;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- 2. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_value NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  usage_limit_per_user INTEGER DEFAULT 1,
  times_used INTEGER DEFAULT 0,
  is_new_user_only BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. COUPON USAGES TABLE (Prevents duplicate redemption & misuse)
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coupon_id TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  order_id TEXT,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for instant lookup during validation
CREATE INDEX IF NOT EXISTS idx_coupon_usages_lookup 
ON public.coupon_usages (coupon_code, customer_email, user_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- Allow everyone (customers & visitors) to read active coupons for validation
DROP POLICY IF EXISTS "Public can view coupons" ON public.coupons;
CREATE POLICY "Public can view coupons" ON public.coupons
  FOR SELECT USING (true);

-- Only Authorized Admins can create, update, or delete coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (
    (auth.jwt() ->> 'email') = 'manage.kintesi@gmail.com' OR
    (auth.jwt() ->> 'email') IN (SELECT email FROM public.profiles WHERE role = 'admin')
  );

-- Coupon Usages: Public can insert their redemption record upon placing order
DROP POLICY IF EXISTS "Customers can insert coupon usage" ON public.coupon_usages;
CREATE POLICY "Customers can insert coupon usage" ON public.coupon_usages
  FOR INSERT WITH CHECK (true);

-- Customers and Admins can view coupon usages
DROP POLICY IF EXISTS "Admins and users can view usages" ON public.coupon_usages;
CREATE POLICY "Admins and users can view usages" ON public.coupon_usages
  FOR SELECT USING (true);

-- 5. DEFAULT SEED COUPON: KINTESI10 (Welcome Coupon for New Users - 7 Days)
INSERT INTO public.coupons (
  id,
  code,
  description,
  discount_type,
  discount_percent,
  discount_value,
  min_order_value,
  max_discount,
  usage_limit_per_user,
  times_used,
  is_new_user_only,
  is_active,
  created_at
) VALUES (
  'kintesi10-default',
  'KINTESI10',
  'Welcome Coupon for New Customers (Valid for 7 days after registration)',
  'percentage',
  10,
  10,
  500,
  1000,
  1,
  0,
  true,
  true,
  timezone('utc'::text, now())
) ON CONFLICT (code) DO NOTHING;

-- 6. ENABLE REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'coupons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'coupon_usages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupon_usages;
  END IF;
END $$;
