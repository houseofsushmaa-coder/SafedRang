-- SafedRang: Customer Dashboard — Supabase Migration
-- Run this in the Supabase SQL Editor to add the required columns to profiles.
-- These columns store saved addresses and phone for the Customer Dashboard.

-- Step 1: Add optional profile columns (safe to run multiple times)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone         TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS saved_addresses JSONB DEFAULT '[]'::jsonb;

-- Step 2: RLS — allow customers to read and update only their own profile
-- (These policies may already exist; skip if they do)

-- Allow customers to read their own profile
CREATE POLICY IF NOT EXISTS "customers_read_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow customers to update their own profile
CREATE POLICY IF NOT EXISTS "customers_update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 3: RLS — allow customers to read their own orders
-- Orders table uses customer_email to match; emails are unique per auth user.
CREATE POLICY IF NOT EXISTS "customers_read_own_orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (customer_email = auth.jwt() ->> 'email');

-- ✅ Done. Customers can now:
-- - Read & update their own profiles (phone, saved_addresses)
-- - Read their own orders by email match
