-- ==============================================================================
-- 🚀 CARTFLY STORE SETTINGS & BANNERS PERSISTENCE FIX (CLEAN RECREATE)
-- ==============================================================================
-- এই স্ক্রিপ্টটি আপনার Supabase SQL Editor এ গিয়ে Run করুন।
-- এটি পুরানো অসামঞ্জস্যপূর্ণ সেটিংস টেবিল ড্রপ করে ফ্রেশ কলামসহ নতুন টেবিল তৈরি করবে।
-- ==============================================================================

-- ১. পুরানো টেবিল নিরাপদভাবে ড্রপ করে নতুন করে ফ্রেশ টেবিল তৈরি
DROP TABLE IF EXISTS public.store_settings CASCADE;

CREATE TABLE public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT DEFAULT 'Cart Fly',
  helpline_phone TEXT DEFAULT '01805930164',
  support_email TEXT DEFAULT 'support@cartfly.com',
  bkash_number TEXT DEFAULT '01800000000',
  bkash_type TEXT DEFAULT 'Merchant',
  nagad_number TEXT DEFAULT '01800000000',
  nagad_type TEXT DEFAULT 'Merchant',
  rocket_number TEXT DEFAULT '01800000000',
  rocket_type TEXT DEFAULT 'Merchant',
  delivery_fee_inside_dhaka NUMERIC DEFAULT 60,
  delivery_fee_outside_dhaka NUMERIC DEFAULT 120,
  free_shipping_threshold NUMERIC DEFAULT 1000,
  authorized_admins TEXT[] DEFAULT ARRAY['tamim.hasan2005@gmail.com'],
  banners JSONB DEFAULT '{"showHeroSection": true, "showSpotlight": true, "showFlashSale": true, "flashSaleHours": 4, "flashSaleTheme": "sunset"}'::JSONB,
  settings_payload JSONB DEFAULT '{}'::JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ২. ডিফল্ট রো ইনসার্ট
INSERT INTO public.store_settings (id, store_name, helpline_phone, support_email, banners, settings_payload)
VALUES (
  'default',
  'Cart Fly',
  '01805930164',
  'support@cartfly.com',
  '{"showHeroSection": true, "showSpotlight": true, "showFlashSale": true, "flashSaleHours": 4, "flashSaleTheme": "sunset"}'::JSONB,
  '{}'::JSONB
)
ON CONFLICT (id) DO UPDATE 
SET 
  banners = EXCLUDED.banners,
  updated_at = now();

-- ৩. RLS পারমিশন চালু ও ওপেন এক্সেস সেট
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store settings viewable by everyone" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Store settings update by everyone" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

-- ৪. ভেরিফিকেশন (চেক করুন সফলভাবে তৈরি হয়েছে কিনা)
SELECT id, store_name, banners FROM public.store_settings;
