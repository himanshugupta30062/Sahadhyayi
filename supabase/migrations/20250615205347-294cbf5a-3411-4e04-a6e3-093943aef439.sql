
-- 1. Create gender enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
    CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');
  END IF;
END$$;

-- 2. Create user_profile table
CREATE TABLE IF NOT EXISTS public.user_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  username text UNIQUE,
  email text UNIQUE,
  profile_picture_url text,
  bio text,
  dob date,
  gender public.gender_type,
  location text,
  writing_frequency text,
  stories_written_count integer DEFAULT 0,
  stories_read_count integer DEFAULT 0,
  joined_at timestamp with time zone DEFAULT now(),
  life_tags text[] DEFAULT ARRAY[]::text[],
  social_links jsonb DEFAULT '{}',
  deleted boolean DEFAULT FALSE,
  last_updated timestamp with time zone DEFAULT now()
);

-- 3. Add auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.set_last_updated_user_profile()
RETURNS trigger AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
  SET search_path = 'public, pg_catalog';

DROP TRIGGER IF EXISTS set_last_updated_user_profile ON public.user_profile;

CREATE TRIGGER set_last_updated_user_profile
  BEFORE UPDATE ON public.user_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.set_last_updated_user_profile();

-- 4. Enable Row-Level Security
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- 5. Policy: Only the user (auth.uid() = id) can select, update, delete their profile
CREATE POLICY "Users can manage own user_profile"
  ON public.user_profile
  FOR ALL
  USING (auth.uid()::uuid = id)
  WITH CHECK (auth.uid()::uuid = id);
