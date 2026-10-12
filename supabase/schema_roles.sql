-- ==============================================================================
-- SAFED RANG — SUPABASE ROLE-BASED ACCESS CONTROL (RBAC) SCHEMA
-- ==============================================================================
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kveyhshtyznlctuckjae/sql/new
-- ==============================================================================

-- 1. Create profiles table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin', 'manager')),
  full_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any to prevent duplicate errors
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- 4. Create RLS Policies
-- Allow anyone authenticated or anon to read profiles (needed for role check & admin panel)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Allow inserting profiles
CREATE POLICY "Allow insert profile" 
ON public.profiles FOR INSERT WITH CHECK (true);

-- 5. Trigger Function: Automatically create/sync profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  user_name TEXT;
BEGIN
  -- Determine role: check user metadata, app metadata, or default to customer
  assigned_role := LOWER(COALESCE(
    NEW.raw_app_meta_data->>'role', 
    NEW.raw_user_meta_data->>'role', 
    'customer'
  ));

  -- Validate role
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
    role = CASE 
      WHEN profiles.role IS NULL OR profiles.role = 'customer' THEN EXCLUDED.role 
      ELSE profiles.role 
    END,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Helper Function: set_user_role(target_email, new_role)
-- Allows changing role with 1 SQL command, updating BOTH profiles and auth.users metadata!
CREATE OR REPLACE FUNCTION public.set_user_role(target_email TEXT, new_role TEXT)
RETURNS TEXT AS $$
DECLARE
  clean_role TEXT;
  user_uuid UUID;
BEGIN
  clean_role := LOWER(TRIM(new_role));
  
  IF clean_role NOT IN ('customer', 'admin', 'super_admin', 'manager') THEN
    RAISE EXCEPTION 'Invalid role: %. Allowed: customer, admin, super_admin, manager', new_role;
  END IF;

  -- Find user id from auth.users
  SELECT id INTO user_uuid FROM auth.users WHERE LOWER(email) = LOWER(TRIM(target_email));
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'No user found with email: %', target_email;
  END IF;

  -- 1. Update profiles table
  INSERT INTO public.profiles (id, email, role, updated_at)
  VALUES (user_uuid, target_email, clean_role, NOW())
  ON CONFLICT (id) DO UPDATE
  SET role = clean_role, updated_at = NOW();

  -- 2. Update auth.users metadata so Supabase JWT also carries the role
  UPDATE auth.users
  SET 
    raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb(clean_role)),
    raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(clean_role))
  WHERE id = user_uuid;

  RETURN format('Successfully updated %s to role %s', target_email, clean_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Backfill existing users in auth.users into public.profiles
INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
  id, 
  email, 
  LOWER(COALESCE(raw_app_meta_data->>'role', raw_user_meta_data->>'role', 'customer')),
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  created_at,
  NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  role = COALESCE(profiles.role, EXCLUDED.role);
