-- ==============================================================================
-- SAFED RANG — TRACKING & ANALYTICS INTEGRATIONS SCHEMA
-- ==============================================================================
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kveyhshtyznlctuckjae/sql/new
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tracking_integrations (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  public_id TEXT DEFAULT '',
  event_settings JSONB DEFAULT '{}'::jsonb,
  additional_config JSONB DEFAULT '{}'::jsonb,
  verification_status TEXT DEFAULT 'unconfigured',
  last_verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure table has Row Level Security enabled
ALTER TABLE public.tracking_integrations ENABLE ROW LEVEL SECURITY;

-- Allow public / storefront to read tracking IDs (never exposes secret tokens)
DROP POLICY IF EXISTS "Allow public select on tracking_integrations" ON public.tracking_integrations;
CREATE POLICY "Allow public select on tracking_integrations" 
  ON public.tracking_integrations FOR SELECT USING (true);

-- Only admins may modify tracking configs (service role bypasses RLS)
DROP POLICY IF EXISTS "Allow all on tracking_integrations" ON public.tracking_integrations;
DROP POLICY IF EXISTS "Allow admin write on tracking_integrations" ON public.tracking_integrations;
CREATE POLICY "Allow admin write on tracking_integrations"
  ON public.tracking_integrations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin', 'manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin', 'manager')));

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
