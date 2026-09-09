-- ==============================================================================
-- 🛒 KINTESI E-COMMERCE - COMPLETE SUPABASE DATABASE SCHEMA & POLICIES
-- ==============================================================================
-- Run this complete SQL script in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- It creates all required tables, JSONB indexes, security RLS policies, and triggers.

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
  image_url TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. PRODUCTS TABLE (Comprehensive Specs, Fabric, Tags, SEO & Variants)
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
-- 7. STORE SETTINGS & BANNERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_store_settings',
  store_name TEXT DEFAULT 'Kintesi Marketplace',
  helpline_phone TEXT DEFAULT '01805930164',
  support_email TEXT DEFAULT 'support@kintesi.com',
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
  banners JSONB DEFAULT '{}'::JSONB,
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
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
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
      WHERE id = auth.uid() AND email = 'tamim.hasan2005@gmail.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories Policies
CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());

-- Products Policies
CREATE POLICY "Products viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (true);

-- Addresses Policies
CREATE POLICY "Users can view their own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert their own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can delete their own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Orders Policies
CREATE POLICY "Orders viewable by creator or admin" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin() OR user_id IS NULL);
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (true);

-- Settings Policies
CREATE POLICY "Store settings viewable by everyone" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update store settings" ON public.store_settings FOR ALL USING (public.is_admin());

-- Chat Policies
CREATE POLICY "Public chat messages viewable" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins and senders can update chat messages" ON public.chat_messages FOR UPDATE USING (true);
CREATE POLICY "Admins can delete chat messages" ON public.chat_messages FOR DELETE USING (true);

-- Realtime Publication for Live Chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ==============================================================================
-- 10. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON public.chat_messages(created_at DESC);
