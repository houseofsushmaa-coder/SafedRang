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

-- Allow admins / service role to modify tracking configs
DROP POLICY IF EXISTS "Allow all on tracking_integrations" ON public.tracking_integrations;
CREATE POLICY "Allow all on tracking_integrations" 
  ON public.tracking_integrations FOR ALL USING (true) WITH CHECK (true);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
