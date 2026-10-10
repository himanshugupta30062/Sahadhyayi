-- Migration: Create public_profiles view and secure profile column exposure
-- Ensures only safe, non-sensitive columns are exposed for public discovery and community features

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  full_name,
  username,
  profile_photo_url,
  bio,
  location,
  writing_frequency,
  stories_read_count,
  stories_written_count,
  last_seen,
  created_at
FROM public.profiles;

-- Grant access on public_profiles view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Add RLS policy notes for profiles table
-- Sensitive columns like private location coordinates, dob, and gender are kept in profiles
-- and only updated or accessed directly by their owner (auth.uid() = id).
COMMENT ON VIEW public.public_profiles IS 'Public safe view of reader profiles exposing only non-sensitive columns';
