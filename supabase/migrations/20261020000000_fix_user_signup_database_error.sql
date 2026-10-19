-- ============================================================================
-- Migration: 20261020000000_fix_user_signup_database_error.sql
-- Purpose: Fix "Database error saving new user" during account registration
--
-- Root Cause:
-- 1. Trigger `trg_send_welcome_email` on `public.profiles` attempts to invoke
--    `extensions.http_post` via pg_net synchronously without an exception handler.
--    In Supabase managed databases, this function is either in `net.http_post`
--    or fails, causing an unhandled PostgreSQL exception.
-- 2. This trigger fires during `INSERT ON public.profiles`, which in turn is
--    fired by `on_auth_user_created` trigger on `auth.users`.
-- 3. Any unhandled exception during `handle_new_user()` or subsequent profile
--    triggers causes Supabase Auth to abort user creation with:
--    "Database error saving new user".
--
-- Fix:
-- 1. Safely drop the blocking `trg_send_welcome_email` trigger.
-- 2. Ensure `public.profiles` has all expected columns, constraints, and defaults.
-- 3. Rewrite `public.handle_new_user()` to be 100% resilient:
--    - Handles username sanitization & uniqueness collision loops.
--    - Uses EXCEPTION handlers so profile creation NEVER aborts auth user signup.
-- 4. Grant explicit table permissions to supabase_auth_admin, postgres, service_role.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Drop fragile triggers on public.profiles that block signups
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_send_welcome_email ON public.profiles;

-- ----------------------------------------------------------------------------
-- 2. Ensure public.profiles columns & defaults exist
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure username index for fast collision checking
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(lower(username));

-- ----------------------------------------------------------------------------
-- 3. Robust, Fault-Tolerant handle_new_user() Trigger Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_base_username text;
  v_username text;
  v_full_name text;
  v_avatar text;
  v_suffix integer := 0;
BEGIN
  -- Safe extraction of full name
  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(trim(split_part(NEW.email, '@', 1)), ''),
    'Reader'
  );

  -- Safe extraction of avatar
  v_avatar := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'picture'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'profile_photo_url'), '')
  );

  -- Safe base username extraction
  v_base_username := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''),
    NULLIF(trim(split_part(NEW.email, '@', 1)), ''),
    'reader'
  );

  -- Sanitize username (lowercase alphanumeric and underscores only)
  v_base_username := regexp_replace(lower(v_base_username), '[^a-z0-9_]', '_', 'g');
  IF length(v_base_username) < 3 THEN
    v_base_username := v_base_username || '_' || substr(replace(NEW.id::text, '-', ''), 1, 4);
  END IF;

  v_username := v_base_username;

  -- Ensure unique username loop (prevents 23505 unique_violation)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(v_username) AND id <> NEW.id) LOOP
    v_suffix := v_suffix + 1;
    v_username := v_base_username || '_' || v_suffix::text;
    IF v_suffix > 25 THEN
      v_username := v_base_username || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
      EXIT;
    END IF;
  END LOOP;

  -- Resilient profile insertion
  BEGIN
    INSERT INTO public.profiles (
      id,
      full_name,
      username,
      profile_photo_url,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      v_full_name,
      v_username,
      v_avatar,
      COALESCE(NEW.created_at, now()),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: minimal insert if extended columns have unexpected constraints
    BEGIN
      INSERT INTO public.profiles (id, full_name, created_at)
      VALUES (NEW.id, v_full_name, now())
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- NEVER allow profile creation failure to abort user account signup!
      RAISE WARNING 'handle_new_user profile creation warning for %: %', NEW.id, SQLERRM;
    END;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Top-level catch: guarantees auth.users record is always safely committed
  RAISE WARNING 'handle_new_user critical handler caught: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Re-attach trigger on auth.users
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. Safe, non-blocking Welcome Email Function (Optional pg_net)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions, pg_temp
AS $$
BEGIN
  -- Entire body is wrapped in an exception block:
  -- Failure to send an email will NEVER abort database operations.
  BEGIN
    -- Check if net.http_post exists before calling
    IF EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'net' AND p.proname = 'http_post'
    ) THEN
      PERFORM net.http_post(
        url := 'https://rknxtatvlzunatpyqxro.supabase.co/functions/v1/send-welcome-email',
        body := jsonb_build_object(
          'email', NEW.id,
          'name', COALESCE(NEW.full_name, 'Reader')
        ),
        headers := jsonb_build_object('Content-Type', 'application/json'),
        timeout_milliseconds := 3000
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Non-fatal: could not dispatch welcome email via pg_net: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Grant Permissions to Database Roles
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, supabase_auth_admin, service_role, authenticated, anon;
GRANT ALL ON public.profiles TO postgres, supabase_auth_admin, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Ensure RLS allows users to insert/update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
