-- Safed Rang — order emails
-- Run once in Supabase → SQL Editor. Safe to run again.
-- Records which emails each order has had (so a customer never gets the same one twice).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS email_log jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Check: should return one row named "email_log".
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'email_log';
