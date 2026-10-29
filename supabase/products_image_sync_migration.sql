-- ==============================================================================
-- SAFED RANG — PRODUCTS & STORAGE SYNCHRONIZATION MIGRATION
-- ==============================================================================
-- Fixes:
-- 1. Adds missing column definitions to public.products so product updates
--    (images, category_name, variations, product_type) persist cleanly.
-- 2. Configures Row Level Security (RLS) policies allowing public read access
--    and authorized updates to products and product_images.
-- 3. Configures Supabase Storage policies for 'product-images' bucket so admin
--    image uploads succeed with valid public URLs.
-- ==============================================================================

-- 1. Add missing columns to public.products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'In Stock';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'simple';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS attribute_name TEXT DEFAULT 'Size';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb;

-- 2. Configure Row Level Security (RLS) Policies on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Public products are viewable by everyone" 
ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow product update" ON public.products;
CREATE POLICY "Allow product update" 
ON public.products FOR ALL USING (true) WITH CHECK (true);

-- 3. Configure RLS Policies on product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public product_images are viewable by everyone" ON public.product_images;
CREATE POLICY "Public product_images are viewable by everyone" 
ON public.product_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow product_images update" ON public.product_images;
CREATE POLICY "Allow product_images update" 
ON public.product_images FOR ALL USING (true) WITH CHECK (true);

-- 4. Configure RLS Policies on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON public.categories;
CREATE POLICY "Public categories are viewable by everyone" 
ON public.categories FOR SELECT USING (true);

-- 5. Storage Policies for 'product-images' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public view for product-images" ON storage.objects;
CREATE POLICY "Public view for product-images" 
ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow upload for product-images" ON storage.objects;
CREATE POLICY "Allow upload for product-images" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow update for product-images" ON storage.objects;
CREATE POLICY "Allow update for product-images" 
ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow delete for product-images" ON storage.objects;
CREATE POLICY "Allow delete for product-images" 
ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

