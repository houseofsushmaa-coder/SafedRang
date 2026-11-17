-- Safed Rang — visitor analytics + "mark as read" for orders
-- Run once in Supabase → SQL Editor. Safe to run again.

BEGIN;

-- ── 1. Visitor events (written only by the site-visit server function) ──────────
CREATE TABLE IF NOT EXISTS public.site_events (
  id            bigserial PRIMARY KEY,
  created_at    timestamptz NOT NULL DEFAULT now(),
  visitor_id    text NOT NULL,
  session_id    text NOT NULL,
  event         text NOT NULL,
  path          text,
  page_title    text,
  product_id    text,
  product_title text,
  value         numeric,
  quantity      numeric,
  order_id      text,
  search_term   text,
  referrer      text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  ip            text,
  country       text,
  timezone      text,
  language      text,
  screen        text,
  device        text,
  os            text,
  browser       text,
  user_agent    text
);

CREATE INDEX IF NOT EXISTS site_events_created_at_idx ON public.site_events (created_at DESC);
CREATE INDEX IF NOT EXISTS site_events_session_idx    ON public.site_events (session_id);
CREATE INDEX IF NOT EXISTS site_events_visitor_idx    ON public.site_events (visitor_id);

-- Only admins can read it; nobody can write through the public API
-- (the server function uses the service role).
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS site_events_admin_read ON public.site_events;
CREATE POLICY site_events_admin_read ON public.site_events FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS site_events_admin_delete ON public.site_events;
CREATE POLICY site_events_admin_delete ON public.site_events FOR DELETE USING (public.is_admin());

-- ── 2. Orders: "mark as read" ────────────────────────────────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_seen_at timestamptz;

-- Everything that exists today counts as read, so the badge starts at 0.
UPDATE public.orders SET admin_seen_at = now() WHERE admin_seen_at IS NULL;

COMMIT;

-- Check
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_events') AS site_events_table,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'admin_seen_at') AS admin_seen_column;

-- Optional, privacy: delete visitor data older than 90 days (run any time).
-- DELETE FROM public.site_events WHERE created_at < now() - interval '90 days';
