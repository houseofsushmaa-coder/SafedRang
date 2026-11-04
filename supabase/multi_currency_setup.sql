-- Safed Rang — charge online orders in the shopper's currency
-- Run once in Supabase → SQL Editor. Safe to run again.
-- Until this is run, online payments simply continue in INR.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS charge_currency text,      -- e.g. USD (empty = charged in INR)
  ADD COLUMN IF NOT EXISTS charge_amount   numeric,   -- amount Cashfree charged, in charge_currency
  ADD COLUMN IF NOT EXISTS fx_rate         numeric;   -- INR → charge_currency rate used

-- Check: should list the three columns.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
  AND column_name IN ('charge_currency', 'charge_amount', 'fx_rate');
