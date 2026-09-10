-- ==============================================================================
-- KINTESI DATABASE MIGRATION: Dropshipping / Supplier URL for Products
-- ==============================================================================
-- Run this SQL in your Supabase Project Dashboard -> SQL Editor

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS dropshipping_url TEXT;

COMMENT ON COLUMN public.products.dropshipping_url IS 'Private supplier / dropshipping source URL for admin re-ordering and inventory management';
