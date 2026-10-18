-- Migration: Fix 3 Security Advisor Findings (Data Privacy, Storage Listing, Account Security)
-- 1. Storage: Restrict file listing in public 'books' bucket (Info)
--    Files are public for reading with a direct URL, but bucket listing is restricted to own uploads.
-- 2. Auth: Enforce profile ownership for UPDATE and DELETE operations (Info)
-- 3. Data Exposure: Protect personal details (coordinates, emails, phones) from anonymous scraping (Critical & Info)

-- ============================================================================
-- 1. FIX: A rule lets anyone list files in books (storage.objects)
-- ============================================================================

-- Drop overly broad SELECT policies on storage.objects for the 'books' bucket
DROP POLICY IF EXISTS "Users can view user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public can view books" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view books" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read books storage" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own uploads" ON storage.objects;

-- Allow authenticated users to view/list only their own uploaded files in user-uploads folder
CREATE POLICY "Users can view their own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'books'
  AND (storage.foldername(name))[1] = 'user-uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================================================
-- 2. FIX: Authentication & account security (public.profiles UPDATE & DELETE)
-- ============================================================================

-- Ensure RLS is active on public.profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Enforce that profiles can only be updated by the account owner
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Enforce that profiles can only be deleted by the account owner
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- ============================================================================
-- 3. FIX: Exposed personal & sensitive data
-- ============================================================================

-- A. Protect public.profiles location coordinates & private fields from anon scraping
DROP POLICY IF EXISTS "Public can view basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public can view minimal profile info" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;

-- Authenticated users can view community profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Revoke broad anonymous table access from profiles
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Ensure public_profiles view provides safe public profile information without coordinates
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

GRANT SELECT ON public.public_profiles TO anon, authenticated;
COMMENT ON VIEW public.public_profiles IS 'Public safe view of reader profiles exposing only non-sensitive columns';

-- B. Protect public.readers locations from unauthenticated exposure
ALTER TABLE IF EXISTS public.readers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view shared reading locations" ON public.readers;
DROP POLICY IF EXISTS "Authenticated users can view shared reading locations" ON public.readers;

CREATE POLICY "Authenticated users can view shared reading locations"
ON public.readers FOR SELECT
TO authenticated
USING (true);

REVOKE ALL ON public.readers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.readers TO authenticated;

-- C. Protect public.user_profile personal data (email, phone, dob, gender)
ALTER TABLE IF EXISTS public.user_profile ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_profile FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profile TO authenticated;

DROP POLICY IF EXISTS "Users can manage own user_profile" ON public.user_profile;
CREATE POLICY "Users can manage own user_profile"
ON public.user_profile FOR ALL
TO authenticated
USING (auth.uid()::uuid = id)
WITH CHECK (auth.uid()::uuid = id);

-- D. Protect phone verifications & WhatsApp contacts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'phone_verifications') THEN
    ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.phone_verifications FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_verifications TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_contacts') THEN
    ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.whatsapp_contacts FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_contacts TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_invitations') THEN
    ALTER TABLE public.whatsapp_invitations ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.whatsapp_invitations FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_invitations TO authenticated;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
