-- ==============================================================================
-- SAFED RANG — PRODUCTS, ONE-OF-ONE & STORAGE SYNCHRONIZATION MIGRATION
-- ==============================================================================
-- Fixes:
-- 1. Adds missing column definitions to public.products so product updates
--    (images, category_name, variations, product_type, is_one_of_one) persist cleanly.
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
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_one_of_one BOOLEAN DEFAULT FALSE;

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


-- 6. Badges table and product badge assignment
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge TEXT;
UPDATE public.products SET badge = 'One of One' WHERE is_one_of_one = TRUE AND (badge IS NULL OR badge = '');

CREATE TABLE IF NOT EXISTS public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6E1E2A',
  status TEXT DEFAULT 'ACTIVE',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read badges" ON public.badges;
CREATE POLICY "Public can read badges" ON public.badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can insert badges" ON public.badges;
CREATE POLICY "Public can insert badges" ON public.badges FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update badges" ON public.badges;
CREATE POLICY "Public can update badges" ON public.badges FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public can delete badges" ON public.badges;
CREATE POLICY "Public can delete badges" ON public.badges FOR DELETE USING (true);

INSERT INTO public.badges (id, name, slug, description, color, status, sort_order)
VALUES
  ('badge_1', 'One of One', 'one-of-one', 'Exclusive one-of-one luxury creations', '#6E1E2A', 'ACTIVE', 0),
  ('badge_2', 'Best Seller', 'best-seller', 'Most loved and highest selling pieces', '#AE8A54', 'ACTIVE', 1),
  ('badge_3', 'New Arrival', 'new-arrival', 'Latest additions to the Safed Rang collection', '#2D5A43', 'ACTIVE', 2),
  ('badge_4', 'Limited Edition', 'limited-edition', 'Special seasonal and rare pieces', '#7A2E5C', 'ACTIVE', 3),
  ('badge_5', 'Handcrafted', 'handcrafted', 'Authentic artisan hand embroidery', '#8B5E34', 'ACTIVE', 4),
  ('badge_6', 'Trending', 'trending', 'Currently trending styles', '#A13D2D', 'ACTIVE', 5)
ON CONFLICT (name) DO NOTHING;


-- 7. Add is_archived and needs_review columns to public.products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE;
