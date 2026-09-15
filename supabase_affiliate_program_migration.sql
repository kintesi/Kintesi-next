-- ==============================================================================
-- 🚀 KINTESI E-COMMERCE - AFFILIATE PROGRAM DATABASE MIGRATION
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
--
-- Features included:
-- 1. `affiliate_users` table: Partner registrations, earnings, and balances
-- 2. `affiliate_withdrawals` table: Payout requests, status, and admin TrxID
-- 3. `affiliate_clicks` table: Link click tracking log
-- 4. `products` table extensions: `is_affiliate_enabled` & `affiliate_commission_rate`
-- 5. `orders` table extensions: `affiliate_code` & `affiliate_commission`
-- 6. Row Level Security (RLS) policies & Performance Indexes
-- 7. Realtime subscription enablement
-- ==============================================================================

-- 1. EXTEND PRODUCTS TABLE (Admin toggle per product)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_affiliate_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS affiliate_commission_rate NUMERIC DEFAULT 10;

-- 2. EXTEND ORDERS TABLE (Order attribution & commission tracking)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS affiliate_code TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS affiliate_commission NUMERIC DEFAULT 0;

-- 3. CREATE AFFILIATE USERS TABLE
CREATE TABLE IF NOT EXISTS public.affiliate_users (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  affiliate_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  total_clicks INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_sales_amount NUMERIC DEFAULT 0,
  total_commission_earned NUMERIC DEFAULT 0,
  available_balance NUMERIC DEFAULT 0,
  total_withdrawn NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'bkash' CHECK (payment_method IN ('bkash', 'nagad', 'rocket', 'bank')),
  account_number TEXT,
  account_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_affiliate_users_code ON public.affiliate_users (affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_phone ON public.affiliate_users (phone);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_user_id ON public.affiliate_users (user_id);

-- 4. CREATE AFFILIATE WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL,
  affiliate_name TEXT NOT NULL,
  affiliate_phone TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 50),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bkash', 'nagad', 'rocket', 'bank')),
  account_number TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_trx_id TEXT,
  admin_note TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for withdrawal queries
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_aff_id ON public.affiliate_withdrawals (affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_code ON public.affiliate_withdrawals (affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_status ON public.affiliate_withdrawals (status);

-- 5. CREATE AFFILIATE CLICKS TABLE
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_code TEXT NOT NULL,
  product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_code ON public.affiliate_clicks (affiliate_code);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.affiliate_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- AFFILIATE USERS POLICIES
DROP POLICY IF EXISTS "Public read affiliate users" ON public.affiliate_users;
CREATE POLICY "Public read affiliate users" 
ON public.affiliate_users FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Public insert affiliate users" ON public.affiliate_users;
CREATE POLICY "Public insert affiliate users" 
ON public.affiliate_users FOR INSERT 
TO public 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public update affiliate users" ON public.affiliate_users;
CREATE POLICY "Public update affiliate users" 
ON public.affiliate_users FOR UPDATE 
TO public 
USING (true);

-- AFFILIATE WITHDRAWALS POLICIES
DROP POLICY IF EXISTS "Public read affiliate withdrawals" ON public.affiliate_withdrawals;
CREATE POLICY "Public read affiliate withdrawals" 
ON public.affiliate_withdrawals FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Public insert affiliate withdrawals" ON public.affiliate_withdrawals;
CREATE POLICY "Public insert affiliate withdrawals" 
ON public.affiliate_withdrawals FOR INSERT 
TO public 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public update affiliate withdrawals" ON public.affiliate_withdrawals;
CREATE POLICY "Public update affiliate withdrawals" 
ON public.affiliate_withdrawals FOR UPDATE 
TO public 
USING (true);

-- AFFILIATE CLICKS POLICIES
DROP POLICY IF EXISTS "Public insert affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Public insert affiliate clicks" 
ON public.affiliate_clicks FOR INSERT 
TO public 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public read affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Public read affiliate clicks" 
ON public.affiliate_clicks FOR SELECT 
TO public 
USING (true);

-- 7. ENABLE REALTIME BROADCASTING
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_users;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_withdrawals;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
