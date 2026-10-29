-- ========================================================
-- SAFED RANG — SHOP SORTING & PRODUCT DISPLAY ORDER MIGRATION
-- ========================================================

-- 1. Add display_order column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

COMMENT ON COLUMN public.products.display_order IS 
'Display order / priority for manual shop ranking. Lower numbers appear first (e.g. 1 is highest priority). 0 indicates standard ordering.';

-- 2. Ensure unique constraints on settings table for seamless upserts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'settings_key_unique'
    ) THEN
        ALTER TABLE public.settings ADD CONSTRAINT settings_key_unique UNIQUE (key);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'settings_group_key_unique'
    ) THEN
        ALTER TABLE public.settings ADD CONSTRAINT settings_group_key_unique UNIQUE ("group", key);
    END IF;
END $$;

-- 3. Ensure RLS policies on settings allow reading and updates
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.settings;
CREATE POLICY "Settings are viewable by everyone" 
ON public.settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Settings can be modified" ON public.settings;
CREATE POLICY "Settings can be modified" 
ON public.settings FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Upsert default shop_sort_settings in settings table
INSERT INTO public.settings (id, key, value, "group", "updatedAt")
VALUES (
    'setting_shop_sort',
    'shop_sort_settings',
    '{"sortMode": "category_first_manual", "categoryOrder": ["Sarees", "Dupattas", "Kurta Sets", "Blouses", "Others"]}'::jsonb,
    'shop',
    NOW()
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, "updatedAt" = NOW();

-- 5. Clean duplicate products: Archive exact duplicate amber semi-precious ring (zz32ew75k)
UPDATE public.products 
SET is_archived = true, status = 'ARCHIVED' 
WHERE id = 'zz32ew75k';
