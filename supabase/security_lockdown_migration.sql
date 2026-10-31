-- ==============================================================================
-- SAFED RANG — SECURITY LOCKDOWN (run once in the Supabase SQL Editor)
-- https://supabase.com/dashboard/project/kveyhshtyznlctuckjae/sql/new
--
-- Replaces the earlier "USING (true)" policies, which let any anonymous visitor
-- read every order/customer, change prices and stock, mark orders paid, and
-- promote themselves to admin.
--
-- PREREQUISITE: deploy the updated edge functions FIRST
--   (cashfree-order, cashfree-verify, cashfree-webhook, place-cod-order).
-- After this runs the browser can no longer insert orders directly, so the old
-- Checkout code would fail.
--
-- Safe to re-run.
-- ==============================================================================

BEGIN;

-- ── 1. Admin check helper ─────────────────────────────────────────────────────
-- SECURITY DEFINER so policies on `profiles` can call it without recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'manager')
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ── 2. Role assignment: only server-side / admins ────────────────────────────
-- set_user_role had no permission check and was callable by anyone via RPC.
DO $$
BEGIN
  IF to_regprocedure('public.set_user_role(text,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.set_user_role(text, text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.set_user_role(text, text) TO service_role;
  END IF;
END $$;

-- Signup trigger: never trust user_metadata (the user controls it).
-- Roles come only from app_metadata, which only the service role can set.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  assigned_role TEXT;
  user_name TEXT;
BEGIN
  assigned_role := LOWER(COALESCE(NEW.raw_app_meta_data->>'role', 'customer'));
  IF assigned_role NOT IN ('customer', 'admin', 'super_admin', 'manager') THEN
    assigned_role := 'customer';
  END IF;

  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
  VALUES (NEW.id, NEW.email, assigned_role, user_name, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    -- An existing profile's role is only ever changed by set_user_role / admins.
    role = profiles.role,
    full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Block non-admins from changing their own role through a profile update.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND current_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- ── 3. Drop every existing policy on the tables we manage ────────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN (
      'profiles', 'orders', 'customers', 'order_items', 'inventory_logs',
      'products', 'product_images', 'categories', 'badges', 'settings',
      'coupons', 'tracking_integrations', 'abandoned_carts'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ── 4. Profiles: own row, or admin ───────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_insert ON public.profiles FOR INSERT WITH CHECK ((id = auth.uid() AND role = 'customer') OR public.is_admin());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_delete ON public.profiles FOR DELETE USING (public.is_admin());

-- ── 5. Orders: customers see their own; only admins (and edge functions) write ─
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_select ON public.orders FOR SELECT USING (
  public.is_admin()
  OR (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text)
  OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(customer_email) = LOWER(auth.jwt() ->> 'email'))
);
CREATE POLICY orders_admin_insert ON public.orders FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY orders_admin_update ON public.orders FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY orders_admin_delete ON public.orders FOR DELETE USING (public.is_admin());

-- ── 6. Admin-only tables (if present) ────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers', 'order_items', 'inventory_logs', 'coupons', 'abandoned_carts'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())', t || '_admin_all', t);
    END IF;
  END LOOP;
END $$;

-- ── 7. Catalogue tables: public read, admin write ────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['products', 'product_images', 'categories', 'badges', 'settings', 'tracking_integrations'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', t || '_public_read', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.is_admin())', t || '_admin_insert', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())', t || '_admin_update', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (public.is_admin())', t || '_admin_delete', t);
    END IF;
  END LOOP;
END $$;

-- ── 8. Product image storage: public read, admin write ───────────────────────
DROP POLICY IF EXISTS "Allow upload for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow update for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete for product-images" ON storage.objects;
DROP POLICY IF EXISTS "product-images admin insert" ON storage.objects;
DROP POLICY IF EXISTS "product-images admin update" ON storage.objects;
DROP POLICY IF EXISTS "product-images admin delete" ON storage.objects;
CREATE POLICY "product-images admin insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "product-images admin update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "product-images admin delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ── Verify (read-only) ───────────────────────────────────────────────────────
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY 1, 2;
