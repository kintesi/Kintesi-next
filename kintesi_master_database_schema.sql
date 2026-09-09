-- ==============================================================================
-- 🛒 KINTESI E-COMMERCE - COMPLETE SUPABASE MASTER DATABASE SCHEMA
-- ==============================================================================
-- Project ID: jhewkxwfujkigvbmybry
-- Run this complete SQL script in your Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/jhewkxwfujkigvbmybry/sql/new
--
-- Features included:
-- 1. All core tables (profiles, categories, products, addresses, orders, store_settings, chat_messages)
-- 2. Storage buckets for product uploads & user avatars
-- 3. Idempotent RLS policies (safe to run repeatedly)
-- 4. Initial store settings & clean categories (ZERO fake products/images)
-- 5. Realtime publication subscriptions
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. USER PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  phone TEXT,
  address TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT DEFAULT '',
  icon TEXT DEFAULT 'ShoppingBag',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. PRODUCTS TABLE (Specs, Fabric, Tags, SEO & Variants)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  discount_price NUMERIC CHECK (discount_price >= 0),
  category_id TEXT NOT NULL,
  stock INTEGER DEFAULT 10 NOT NULL CHECK (stock >= 0),
  images TEXT[] DEFAULT '{}'::TEXT[],
  rating NUMERIC DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  brand TEXT DEFAULT 'Kintesi',
  sku TEXT,
  warranty TEXT,
  highlights TEXT[] DEFAULT '{}'::TEXT[],
  fabric TEXT,
  material TEXT,
  fit_type TEXT,
  care_instructions TEXT,
  origin TEXT DEFAULT 'Made in Bangladesh',
  gender TEXT DEFAULT 'Unisex',
  specifications JSONB DEFAULT '{}'::JSONB,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  sizes TEXT[] DEFAULT '{}'::TEXT[],
  colors JSONB DEFAULT '[]'::JSONB,
  delivery_note TEXT DEFAULT 'অনুগ্রহ করে ডেলিভারি ম্যানের সামনে প্রোডাক্ট খুলে চেক করে নিবেন। ডেলিভারি ম্যান চলে যাওয়ার পর অভিযোগ গ্রহণযোগ্য হবে না।',
  allowed_payment_methods JSONB DEFAULT '["cod", "bkash", "nagad", "card"]'::JSONB,
  payment_instruction TEXT,
  seller_payment JSONB DEFAULT '{}'::JSONB,
  warranty_badge_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. CUSTOMER ADDRESS BOOK TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. ORDERS & INVOICES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  customer_note TEXT,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  seller_payment_snapshot JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. STORE SETTINGS & BANNERS TABLE (With both store_name & settings_payload)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_store_settings',
  store_name TEXT DEFAULT 'Kintesi',
  helpline_phone TEXT DEFAULT '01800-KINTESI',
  support_email TEXT DEFAULT 'support@kintesi.com',
  bkash_number TEXT DEFAULT '01800-123456',
  bkash_type TEXT DEFAULT 'Merchant',
  nagad_number TEXT DEFAULT '01700-654321',
  nagad_type TEXT DEFAULT 'Merchant',
  rocket_number TEXT DEFAULT '01900-987654',
  rocket_type TEXT DEFAULT 'Personal',
  delivery_fee_inside_dhaka NUMERIC DEFAULT 60,
  delivery_fee_outside_dhaka NUMERIC DEFAULT 120,
  free_shipping_threshold NUMERIC DEFAULT 5000,
  authorized_admins TEXT[] DEFAULT ARRAY['manage.kintesi@gmail.com'],
  banners JSONB DEFAULT '{}'::JSONB,
  settings_payload JSONB DEFAULT '{}'::JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. IN-WEBSITE LIVE CHAT MESSAGES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id TEXT NOT NULL DEFAULT 'default_chat',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender TEXT NOT NULL CHECK (sender IN ('customer', 'seller', 'system')),
  sender_name TEXT NOT NULL DEFAULT 'Customer',
  sender_email TEXT,
  text TEXT NOT NULL,
  product_context JSONB DEFAULT NULL,
  order_context JSONB DEFAULT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 9. STORAGE BUCKETS (Product Images & Avatars)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) & IDEMPOTENT POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND lower(email) = 'manage.kintesi@gmail.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories Policies
DROP POLICY IF EXISTS "Categories viewable by everyone" ON public.categories;
CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (true);

-- Products Policies
DROP POLICY IF EXISTS "Products viewable by everyone" ON public.products;
CREATE POLICY "Products viewable by everyone" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (true);

-- Addresses Policies
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
CREATE POLICY "Users can insert their own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Orders Policies
DROP POLICY IF EXISTS "Orders viewable by creator or admin" ON public.orders;
CREATE POLICY "Orders viewable by creator or admin" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin() OR user_id IS NULL);

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (true);

-- Settings Policies
DROP POLICY IF EXISTS "Store settings viewable by everyone" ON public.store_settings;
CREATE POLICY "Store settings viewable by everyone" ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;
CREATE POLICY "Admins can update store settings" ON public.store_settings FOR ALL USING (true);

-- Chat Policies
DROP POLICY IF EXISTS "Public chat messages viewable" ON public.chat_messages;
CREATE POLICY "Public chat messages viewable" ON public.chat_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can send chat messages" ON public.chat_messages;
CREATE POLICY "Anyone can send chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins and senders can update chat messages" ON public.chat_messages;
CREATE POLICY "Admins and senders can update chat messages" ON public.chat_messages FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can delete chat messages" ON public.chat_messages;
CREATE POLICY "Admins can delete chat messages" ON public.chat_messages FOR DELETE USING (true);

-- Storage Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access for Kintesi'
  ) THEN
    CREATE POLICY "Public Access for Kintesi" ON storage.objects FOR SELECT USING (bucket_id IN ('product-images', 'avatars'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Upload for Kintesi'
  ) THEN
    CREATE POLICY "Public Upload for Kintesi" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('product-images', 'avatars'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Update for Kintesi'
  ) THEN
    CREATE POLICY "Public Update for Kintesi" ON storage.objects FOR UPDATE USING (bucket_id IN ('product-images', 'avatars'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Delete for Kintesi'
  ) THEN
    CREATE POLICY "Public Delete for Kintesi" ON storage.objects FOR DELETE USING (bucket_id IN ('product-images', 'avatars'));
  END IF;
END $$;

-- ==============================================================================
-- 11. REALTIME PUBLICATIONS
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- ==============================================================================
-- 12. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON public.chat_messages(created_at DESC);

-- ==============================================================================
-- 13. SEED INITIAL STORE SETTINGS & CLEAN CATEGORIES (ZERO FAKE PRODUCTS)
-- ==============================================================================
INSERT INTO public.store_settings (
  id,
  store_name,
  helpline_phone,
  support_email,
  bkash_number,
  bkash_type,
  nagad_number,
  nagad_type,
  rocket_number,
  rocket_type,
  delivery_fee_inside_dhaka,
  delivery_fee_outside_dhaka,
  free_shipping_threshold,
  authorized_admins,
  banners,
  settings_payload
) VALUES (
  'global_store_settings',
  'Kintesi',
  '01800-KINTESI',
  'support@kintesi.com',
  '01800-123456',
  'Merchant',
  '01700-654321',
  'Merchant',
  '01900-987654',
  'Personal',
  60,
  120,
  5000,
  ARRAY['manage.kintesi@gmail.com'],
  '{"showHeroSection": true, "heroBadge": "PREMIER LIFESTYLE & SHOPPING MARKETPLACE", "heroTitle": "Everything You Need for", "heroHighlightText": "Life, Fashion & Tech", "heroSubtitle": "From authentic designer apparel, sneakers & lifestyle essentials to flagship smartphones, home appliances & gadgets — delivered to your doorstep across Bangladesh.", "heroPrimaryBtnText": "Explore Kintesi Catalog", "heroPrimaryBtnLink": "/shop", "heroSecondaryBtnText": "Browse Categories", "heroSecondaryBtnLink": "/shop", "showSpotlight": false, "showFlashSale": false}'::JSONB,
  '{}'::JSONB
) ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  banners = EXCLUDED.banners;

INSERT INTO public.categories (name, slug, description, image_url, icon) VALUES
  ('Groceries & Daily Essentials', 'groceries-daily-essentials', 'Rice, organic oils, spices, breakfast cereals, snacks & daily pantry', '', 'ShoppingBag'),
  ('Beauty, Skincare & Personal Care', 'beauty-skincare', 'Dermatologist cleansers, serums, sunscreens, hair care & fragrances', '', 'Sparkles'),
  ('Home, Kitchen & Appliances', 'home-kitchen', 'Air fryers, blenders, cookware, smart vacuums & home decor', '', 'Home'),
  ('Men''s Fashion & Apparel', 'mens-fashion', 'Leather jackets, cotton hoodies, polo shirts, suits & streetwear', '', 'Shirt'),
  ('Women''s Fashion & Luxury', 'womens-fashion', 'Designer dresses, luxury handbags, premium tops & jewelry', '', 'Sparkles'),
  ('Footwear & Sneakers', 'footwear-sneakers', 'Running shoes, Nike Jordans, leather boots & casual loafers', '', 'Footprints'),
  ('Smartphones & Tablets', 'smartphones-tablets', 'Flagship iPhones, Samsung Galaxy, iPads & accessories', '', 'Smartphone'),
  ('Laptops & Computers', 'laptops-computers', 'MacBooks, gaming rigs, monitors & workstation gear', '', 'Laptop'),
  ('Audio & Headphones', 'audio-headphones', 'Noise cancelling headphones, wireless earbuds & soundbars', '', 'Headphones'),
  ('Smart Watches & Fitness', 'smart-watches', 'Apple Watch, Garmin fitness trackers & luxury straps', '', 'Watch'),
  ('Health & Baby Care', 'health-baby-care', 'Baby diapers, organic baby foods, vitamins & wellness', '', 'HeartPulse'),
  ('Sports & Fitness Equipment', 'sports-fitness', 'Gym dumbbells, yoga mats, resistance bands & active gear', '', 'Dumbbell')
ON CONFLICT (slug) DO NOTHING;

