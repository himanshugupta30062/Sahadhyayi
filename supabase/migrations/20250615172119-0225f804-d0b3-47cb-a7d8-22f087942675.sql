
-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS writing_frequency text,
  ADD COLUMN IF NOT EXISTS stories_written_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stories_read_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags_used jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. Fill updated_at for existing rows and add trigger to auto-update on change
UPDATE public.profiles SET updated_at = now() WHERE updated_at IS NULL;

CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profile_updated_at ON public.profiles;

CREATE TRIGGER set_profile_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_profile_updated_at();

-- 3. Add policy for profiles table if needed (should already exist for current user, but add for new fields)
-- (You already have: Allow users to view/update their profile: USING (auth.uid() = id);)
