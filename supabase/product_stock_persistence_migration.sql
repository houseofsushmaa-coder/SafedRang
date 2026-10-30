-- ==============================================================================
-- SAFED RANG — PRODUCT STOCK PERSISTENCE & INVENTORY SCHEMA MIGRATION
-- ==============================================================================
-- Ensures:
-- 1. public.products table has all inventory and stock columns correctly typed
-- 2. Defaults stock to 1 unit (instead of 10) for handcrafted one-of-one pieces
-- 3. Configures Row Level Security (RLS) policies allowing select and update
-- 4. Creates public.inventory_logs table for audit trail of stock adjustments
-- ==============================================================================

-- 1. Ensure stock columns exist on public.products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'In Stock';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "lowStockThreshold" INT DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PUBLISHED';

-- 2. Ensure RLS is enabled and policies allow updating stock
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Public products are viewable by everyone" 
ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow product update" ON public.products;
CREATE POLICY "Allow product update" 
ON public.products FOR ALL USING (true) WITH CHECK (true);

-- 3. Create inventory logs table for tracking stock changes
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  previous_stock INT,
  new_stock INT,
  change_amount INT,
  reason TEXT,
  changed_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to inventory_logs" ON public.inventory_logs;
CREATE POLICY "Allow all access to inventory_logs"
ON public.inventory_logs FOR ALL USING (true) WITH CHECK (true);

-- 4. Add index for faster stock queries
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products (stock);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON public.products (stock_status);
