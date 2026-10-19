-- SafedRang: Unified Orders & Checkout Migration
-- 1. Relax legacy strict constraints on "orders" so guest checkouts and flexible order placement succeed
ALTER TABLE public.orders ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS "orders_customerId_fkey";
ALTER TABLE public.orders ALTER COLUMN "orderNumber" DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN "updatedAt" DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- 2. Add modern e-commerce columns to public.orders (safe to run multiple times)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS "order_id" TEXT,
  ADD COLUMN IF NOT EXISTS "customer_name" TEXT,
  ADD COLUMN IF NOT EXISTS "customer_email" TEXT,
  ADD COLUMN IF NOT EXISTS "customer_phone" TEXT,
  ADD COLUMN IF NOT EXISTS "items" JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "shipping_charge" NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_amount" NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "payment_method" TEXT,
  ADD COLUMN IF NOT EXISTS "payment_status" TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "order_status" TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "currency_selected" TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS "user_id" TEXT,
  ADD COLUMN IF NOT EXISTS "shipping_address" JSONB,
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW();

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow select on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow update on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow delete on orders" ON public.orders;

CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow update on orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow delete on orders" ON public.orders FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow all on customers" ON public.customers;
CREATE POLICY "Allow all on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on order_items" ON public.order_items;
CREATE POLICY "Allow all on order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- 4. Reload PostgREST schema cache so all new columns are recognized immediately
NOTIFY pgrst, 'reload schema';
