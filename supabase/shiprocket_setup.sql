-- Safed Rang × Shiprocket
-- Run once in Supabase → SQL Editor. Safe to run again.
-- Adds one column to orders that holds the Shiprocket order / shipment ids,
-- AWB (tracking number), courier and the latest tracking status.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shiprocket jsonb;

-- Lets the tracking webhook find an order by its AWB quickly.
CREATE INDEX IF NOT EXISTS orders_shiprocket_awb_idx
  ON public.orders ((shiprocket ->> 'awb'));

-- Check: should return one row named "shiprocket".
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shiprocket';
