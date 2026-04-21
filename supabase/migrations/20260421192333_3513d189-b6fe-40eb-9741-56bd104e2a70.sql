
-- 1. Fix book_events: replace permissive ALL policy with scoped policies
DROP POLICY IF EXISTS "Service role full access" ON public.book_events;

-- Anyone can read aggregated event counts (needed for view/download counts)
CREATE POLICY "Anyone can view book events"
ON public.book_events FOR SELECT
USING (true);

-- Only authenticated users can log events, and user_id must match (or be null for anonymous views)
CREATE POLICY "Authenticated users can insert their own events"
ON public.book_events FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow anonymous insert for view tracking only (no user_id)
CREATE POLICY "Anonymous can log view events"
ON public.book_events FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND event_type = 'view');

-- 2. Drop unused books_test table
DROP TABLE IF EXISTS public.books_test CASCADE;

-- 3. Fix storage policies for books bucket - enforce ownership
DROP POLICY IF EXISTS "Users can upload to user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can view user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own user-uploads" ON storage.objects;

CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'books'
  AND (storage.foldername(name))[1] = 'user-uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can view user-uploads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'books'
  AND (storage.foldername(name))[1] = 'user-uploads'
);

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'books'
  AND (storage.foldername(name))[1] = 'user-uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'books'
  AND (storage.foldername(name))[1] = 'user-uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. Remove plaintext phone verification columns from user_profile
-- The dedicated phone_verifications table already exists for this purpose
ALTER TABLE public.user_profile
  DROP COLUMN IF EXISTS phone_verification_code,
  DROP COLUMN IF EXISTS phone_verification_expires_at;
