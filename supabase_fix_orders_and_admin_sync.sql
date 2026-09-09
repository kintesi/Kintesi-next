-- ==============================================================================
-- 🚀 CARTFLY DATABASE SYNC & ADMIN PERMISSIONS FIX (IDEMPOTENT & SAFE)
-- ==============================================================================
-- এই স্ক্রিপ্টটি কপি করে Supabase SQL Editor এ Run করুন।
-- ==============================================================================

-- ১. ORDERS টেবিলে কলামসমূহ নিশ্চিতকরণ
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS seller_payment_snapshot JSONB DEFAULT '{}'::JSONB;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_note TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;


-- ২. PRODUCTS টেবিলে কলামসমূহ নিশ্চিতকরণ
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS delivery_note TEXT DEFAULT 'অনুগ্রহ করে ডেলিভারি ম্যানের সামনে প্রোডাক্ট খুলে চেক করে নিবেন। ডেলিভারি ম্যান চলে যাওয়ার পর অভিযোগ গ্রহণযোগ্য হবে না।';

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS allowed_payment_methods JSONB DEFAULT '["cod", "bkash", "nagad", "rocket", "bank"]'::JSONB;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS payment_instruction TEXT;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS seller_payment JSONB DEFAULT '{}'::JSONB;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS warranty_badge_enabled BOOLEAN DEFAULT true;


-- ৩. ORDERS টেবিলের পূর্বের সকল RLS পলিসি ক্লিনআপ ও নতুন পলিসি তৈরি
DO $$ 
BEGIN
    -- Drop all existing orders policies safely
    EXECUTE 'DROP POLICY IF EXISTS "Orders viewable by creator or admin" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Orders viewable by everyone" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update orders" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Orders all operations" ON public.orders';
    EXECUTE 'DROP POLICY IF EXISTS "Public orders access" ON public.orders';
END $$;

CREATE POLICY "Orders viewable by everyone" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (true);


-- ৪. PRODUCTS টেবিলের পূর্বের সকল RLS পলিসি ক্লিনআপ ও নতুন পলিসি তৈরি
DO $$ 
BEGIN
    -- Drop all existing products policies safely
    EXECUTE 'DROP POLICY IF EXISTS "Products viewable by everyone" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can insert products" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update products" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete products" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert products" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can update products" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can delete products" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Products all operations" ON public.products';
END $$;

CREATE POLICY "Products viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete products" ON public.products FOR DELETE USING (true);


-- ৫. ইনডেক্সিং
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products (updated_at DESC);


-- ৬. ভেরিফিকেশন কোয়েরি
SELECT 
  (SELECT count(*) FROM public.products) as total_products,
  (SELECT count(*) FROM public.orders) as total_orders;
