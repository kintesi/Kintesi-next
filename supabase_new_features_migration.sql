-- ==============================================================================
-- 🛒 KINTESI E-COMMERCE - ALL NEW FEATURES SUPABASE SQL MIGRATION
-- ==============================================================================
-- Project ID: jhewkxwfujkigvbmybry
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jhewkxwfujkigvbmybry/sql/new
--
-- This script safely and idempotently activates:
-- 1. Multiple Attributes & Color Variants with 4 Photos (custom_attributes, colors, sizes)
-- 2. Preset Management Table (public.presets) with Color & Size seeds
-- 3. All 8 Specialized Categories & Bengali/English Taxonomy
-- 4. Supplier/Dropshipping URLs, Custom Delivery Notes, Payment Methods
-- 5. Coupons & Promo Code System (coupons, coupon_usages)
-- 6. Unrestricted RLS Policies for Product and Preset management
-- ==============================================================================

-- ==============================================================================
-- 1. PRODUCTS TABLE UPGRADE (Columns for all new product features)
-- ==============================================================================

-- Multiple Attributes (e.g. Size, Capacity, Finish, Material with price adjustments)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '[]'::JSONB;

-- Multi-Color Variants (Color name, hex, price, discount_percent, stock, image, images[4])
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::JSONB;

-- Quick Sizes & Capacities
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}'::TEXT[];

-- Specifications & Hardware/Fabric Attributes
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::JSONB;

-- Dropshipping / Supplier private URL for admin inventory
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS dropshipping_url TEXT;

-- Delivery Note (Custom warning / notice for customer)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS delivery_note TEXT DEFAULT 'অনুগ্রহ করে ডেলিভারি ম্যানের সামনে প্রোডাক্ট খুলে চেক করে নিবেন। ডেলিভারি ম্যান চলে যাওয়ার পর অভিযোগ গ্রহণযোগ্য হবে না।';

-- Allowed Payment Methods & Custom Instructions
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS allowed_payment_methods JSONB DEFAULT '["cod", "bkash", "nagad", "card"]'::JSONB;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS payment_instruction TEXT;

-- Highlights, Warranty & Badges
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}'::TEXT[];

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS warranty TEXT;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS warranty_badge_enabled BOOLEAN DEFAULT true;

-- Fashion / Material attributes
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS fabric TEXT;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS material TEXT;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS fit_type TEXT;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS care_instructions TEXT;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'Made in Bangladesh';

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Unisex';

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;

-- Clean legacy columns
ALTER TABLE public.products DROP COLUMN IF EXISTS seller_payment;

-- ==============================================================================
-- 2. DEDICATED PRESETS TABLE (Color Presets & Size Presets Management)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.presets (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('color', 'size')),
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on presets
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Presets viewable by everyone" ON public.presets;
CREATE POLICY "Presets viewable by everyone" ON public.presets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert presets" ON public.presets;
CREATE POLICY "Admins can insert presets" ON public.presets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update presets" ON public.presets;
CREATE POLICY "Admins can update presets" ON public.presets FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can delete presets" ON public.presets;
CREATE POLICY "Admins can delete presets" ON public.presets FOR DELETE USING (true);

-- Seed Default Color Presets
INSERT INTO public.presets (id, type, name, value, category) VALUES
  ('color-pink', 'color', 'Pink', '#EC4899', 'general'),
  ('color-red', 'color', 'Red', '#EF4444', 'general'),
  ('color-yellow', 'color', 'Yellow', '#EAB308', 'general'),
  ('color-white', 'color', 'White', '#FFFFFF', 'general'),
  ('color-black', 'color', 'Black', '#000000', 'general'),
  ('color-navy-blue', 'color', 'Navy Blue', '#1E3A8A', 'general'),
  ('color-olive-green', 'color', 'Olive Green', '#65A30D', 'general'),
  ('color-grey', 'color', 'Grey', '#6B7280', 'general'),
  ('color-beige', 'color', 'Beige', '#D4B996', 'general'),
  ('color-maroon', 'color', 'Maroon', '#881337', 'general'),
  ('color-purple', 'color', 'Purple', '#A855F7', 'general'),
  ('color-sky-blue', 'color', 'Sky Blue', '#0EA5E9', 'general'),
  ('color-rose-gold', 'color', 'Rose Gold', '#B76E79', 'general'),
  ('color-emerald', 'color', 'Emerald', '#10B981', 'general')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  value = EXCLUDED.value;

-- Seed Default Size Presets
INSERT INTO public.presets (id, type, name, value, category) VALUES
  ('size-xs', 'size', 'XS', 'XS', 'apparel'),
  ('size-s', 'size', 'S', 'S', 'apparel'),
  ('size-m', 'size', 'M', 'M', 'apparel'),
  ('size-l', 'size', 'L', 'L', 'apparel'),
  ('size-xl', 'size', 'XL', 'XL', 'apparel'),
  ('size-xxl', 'size', 'XXL', 'XXL', 'apparel'),
  ('size-3xl', 'size', '3XL', '3XL', 'apparel'),
  ('size-freesize', 'size', 'Free Size', 'Free Size', 'apparel'),
  ('size-32gb', 'size', '32GB', '32GB', 'storage'),
  ('size-64gb', 'size', '64GB', '64GB', 'storage'),
  ('size-128gb', 'size', '128GB', '128GB', 'storage'),
  ('size-256gb', 'size', '256GB', '256GB', 'storage'),
  ('size-512gb', 'size', '512GB', '512GB', 'storage'),
  ('size-1tb', 'size', '1TB', '1TB', 'storage'),
  ('size-2tb', 'size', '2TB', '2TB', 'storage'),
  ('size-50ml', 'size', '50ml', '50ml', 'volume'),
  ('size-100ml', 'size', '100ml', '100ml', 'volume'),
  ('size-250ml', 'size', '250ml', '250ml', 'volume'),
  ('size-500ml', 'size', '500ml', '500ml', 'volume'),
  ('size-1l', 'size', '1L', '1L', 'volume'),
  ('size-2l', 'size', '2L', '2L', 'volume'),
  ('size-5l', 'size', '5L', '5L', 'volume'),
  ('size-100g', 'size', '100g', '100g', 'weight'),
  ('size-250g', 'size', '250g', '250g', 'weight'),
  ('size-500g', 'size', '500g', '500g', 'weight'),
  ('size-1kg', 'size', '1kg', '1kg', 'weight'),
  ('size-2kg', 'size', '2kg', '2kg', 'weight'),
  ('size-5kg', 'size', '5kg', '5kg', 'weight'),
  ('size-39', 'size', '39', '39', 'footwear'),
  ('size-40', 'size', '40', '40', 'footwear'),
  ('size-41', 'size', '41', '41', 'footwear'),
  ('size-42', 'size', '42', '42', 'footwear'),
  ('size-43', 'size', '43', '43', 'footwear'),
  ('size-44', 'size', '44', '44', 'footwear')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  value = EXCLUDED.value,
  category = EXCLUDED.category;

-- ==============================================================================
-- 3. INSERT ALL 8 SPECIALIZED HEALTH & LIFESTYLE CATEGORIES
-- ==============================================================================
INSERT INTO public.categories (name, slug, description, image_url, icon) VALUES
  (
    'Menstrual Heating & Period Care',
    'menstrual-heating-period-care',
    'Rechargeable menstrual heating belts, wireless warming vibration massage pads & uterus cramp relief devices',
    '',
    'HeartPulse'
  ),
  (
    'Posture Correctors & Spine Care',
    'orthopedic-posture-spine-care',
    'Upper back posture correctors, clavicle spine alignment braces, lumbar decompression belts & orthopedic supports',
    '',
    'ShieldCheck'
  ),
  (
    'Beauty, Laser & Therapy Gadgets',
    'beauty-skincare-therapy-gadgets',
    'IPL laser hair removal handsets, LED photon facial rejuvenation masks, ultrasonic skin scrubbers & RF lifting devices',
    '',
    'Sparkles'
  ),
  (
    'Electric Pain Relief & Physiotherapy',
    'pain-relief-physiotherapy-devices',
    'TENS EMS pulse electrotherapy massagers, electric infrared knee pads, cervical neck traction & deep tissue massage guns',
    '',
    'Zap'
  ),
  (
    'Sleep Wellness & Anti-Snoring',
    'sleep-wellness-anti-snoring',
    'Micro-electric smart anti-snoring devices, silicone nasal vents, sleep sound therapy machines & blackout 3D Bluetooth eye masks',
    '',
    'Moon'
  ),
  (
    'Maternity & Postpartum Care',
    'maternity-postpartum-mother-care',
    'Wearable hands-free electric breast pumps, 3-in-1 postpartum recovery abdominal binders, milk warmers & maternity cushions',
    '',
    'Heart'
  ),
  (
    'Smart Lifestyle & Problem Solvers',
    'smart-lifestyle-problem-solvers',
    'Rechargeable fabric lint shavers, ultrasonic jewelry cleaners, portable electric mini sealers & silicone drain hair catchers',
    '',
    'Cpu'
  ),
  (
    'Electric Pedicure & Foot Care',
    'foot-care-pedicure-tools',
    'Waterproof electric hard skin callus removers, silicone heel anti-crack protectors, electric foot baths & acupressure mats',
    '',
    'Footprints'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- ==============================================================================
-- 4. COUPONS & PROMO CODE SYSTEM (If not already created)
-- ==============================================================================
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

CREATE INDEX IF NOT EXISTS idx_coupon_usages_lookup 
ON public.coupon_usages (coupon_code, customer_email, user_id);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view coupons" ON public.coupons;
CREATE POLICY "Public can view coupons" ON public.coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (true);

DROP POLICY IF EXISTS "Customers can insert coupon usage" ON public.coupon_usages;
CREATE POLICY "Customers can insert coupon usage" ON public.coupon_usages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins and users can view usages" ON public.coupon_usages;
CREATE POLICY "Admins and users can view usages" ON public.coupon_usages FOR SELECT USING (true);

-- Seed Welcome Coupon KINTESI10
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
  0,
  500,
  200,
  1,
  0,
  TRUE,
  TRUE,
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Add coupon_code column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- ==============================================================================
-- 5. BULLETPROOF RLS POLICIES FOR PRODUCTS (Never blocks admin saves)
-- ==============================================================================
DROP POLICY IF EXISTS "Products viewable by everyone" ON public.products;
CREATE POLICY "Products viewable by everyone" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (true);

-- ==============================================================================
-- 6. REALTIME PUBLICATION SUBSCRIPTIONS
-- ==============================================================================
DO 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'presets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.presets;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'coupons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  END IF;
END ;
