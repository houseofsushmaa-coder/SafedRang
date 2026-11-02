-- Safed Rang — "Jewellery" category
-- Run once in Supabase → SQL Editor. Safe to run again.
-- Moves the semi-precious stone rings / necklaces / bracelets out of "Others".
-- The chikankari pants stay in "Others".

BEGIN;

-- 1. The category itself (shown in Admin → Categories)
INSERT INTO public.categories (id, name, slug, description, status, "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Jewellery', 'jewellery',
       'Handcrafted semi-precious stone rings, necklaces and bracelets',
       'ACTIVE', 4, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE lower(name) = 'jewellery');

-- 2. Move the jewellery pieces into it
UPDATE public.products p
SET category_name = 'Jewellery',
    "categoryId"  = (SELECT id FROM public.categories WHERE lower(name) = 'jewellery' LIMIT 1),
    "updatedAt"   = now()
WHERE p.category_name = 'Others'
  AND (
        p.fabric ILIKE '%semi%precious%'
     OR p.name ~* '(^|[^a-z])(ring|rings|necklace|nacklace|bracelet|pendant|earring|earrings|agate)([^a-z]|$)'
  );

COMMIT;

-- Check: Jewellery should be about 24 (23 live + 1 archived); Others should be 2 (the pants).
SELECT category_name, count(*) AS products
FROM public.products
WHERE category_name IN ('Jewellery', 'Others')
GROUP BY category_name
ORDER BY category_name;
