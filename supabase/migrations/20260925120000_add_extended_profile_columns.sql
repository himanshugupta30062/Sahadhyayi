-- Add extended profile fields to public.profiles to align with frontend profile forms
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS life_tags text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Ensure name mirrors full_name if queried directly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN name text;
    UPDATE public.profiles SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
  END IF;
END $$;
