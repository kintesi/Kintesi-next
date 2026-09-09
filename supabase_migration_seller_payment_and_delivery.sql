-- ==============================================================================
-- 🛒 CARTFLY E-COMMERCE - SUPABASE SQL MIGRATION SCRIPT
-- ==============================================================================
-- এই স্ক্রিপ্টটি আপনার Supabase Dashboard এর SQL Editor এ গিয়ে এক ক্লিকে Run করুন।
-- (https://supabase.com/dashboard/project/_/sql)
--
-- যা যা যুক্ত ও আপডেট হবে:
-- 1. Products টেবিল: ডেলিভারি নোট, সেলার পার্সোনাল পেমেন্ট ও ব্যাংক ডিটেইলস, এলাউড পেমেন্ট মেথড
-- 2. Orders টেবিল: TrxID/ব্যাংক রেফারেন্স এবং সেলার পেমেন্ট স্ন্যাপশট
-- ==============================================================================

-- ১. PRODUCTS টেবিলে নতুন কলামসমূহ যুক্তকরণ
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS delivery_note TEXT DEFAULT 'অনুগ্রহ করে ডেলিভারি ম্যানের সামনে প্রোডাক্ট খুলে চেক করে নিবেন। ডেলিভারি ম্যান চলে যাওয়ার পর অভিযোগ গ্রহণযোগ্য হবে না।';

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS allowed_payment_methods JSONB DEFAULT '["cod", "bkash", "nagad", "card"]'::JSONB;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS payment_instruction TEXT;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS seller_payment JSONB DEFAULT '{}'::JSONB;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS warranty_badge_enabled BOOLEAN DEFAULT true;


-- ২. ORDERS টেবিলে ট্রানজেকশন আইডি এবং সেলার পেমেন্ট স্ন্যাপশট যুক্তকরণ
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS seller_payment_snapshot JSONB DEFAULT '{}'::JSONB;


-- ৩. ইনডেক্সিং (ফাস্ট কোয়েরি ও পারফরম্যান্সের জন্য)
CREATE INDEX IF NOT EXISTS idx_products_allowed_payments ON public.products USING gin (allowed_payment_methods);
CREATE INDEX IF NOT EXISTS idx_products_seller_payment ON public.products USING gin (seller_payment);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON public.orders (transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_snapshot ON public.orders USING gin (seller_payment_snapshot);


-- ৪. (ঐচ্ছিক) ডেমো ডাটা ও কলাম ভেরিফিকেশন কোয়েরি
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('products', 'orders') 
AND column_name IN ('delivery_note', 'allowed_payment_methods', 'payment_instruction', 'seller_payment', 'transaction_id', 'seller_payment_snapshot');
