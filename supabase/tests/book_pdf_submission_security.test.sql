-- Regression checks for the private AI-assisted book PDF intake schema.
-- Run only after migrations have been applied to a disposable/test Supabase DB:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/book_pdf_submission_security.test.sql
DO $test$
DECLARE
  submissions_oid oid := 'public.book_pdf_submissions'::regclass;
  bucket_is_private boolean;
  bucket_limit bigint;
  bucket_mimes text[];
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = submissions_oid),
    'RLS must be enabled on book_pdf_submissions';

  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'book_pdf_submissions'
      AND policyname = 'Users can view own PDF submissions'
      AND cmd = 'SELECT'
  ), 'owner SELECT policy is missing';

  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'book_pdf_submissions'
      AND policyname = 'Users can create own PDF submissions'
      AND cmd = 'INSERT'
      AND with_check ILIKE '%rights_attested%'
      AND with_check ILIKE '%auth.uid%'
  ), 'owner INSERT policy must enforce ownership and rights attestation';

  ASSERT NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'book_pdf_submissions'
      AND cmd IN ('UPDATE', 'ALL')
  ), 'client UPDATE/ALL policy must not be added to submissions';

  SELECT public, file_size_limit, allowed_mime_types
    INTO bucket_is_private, bucket_limit, bucket_mimes
  FROM storage.buckets
  WHERE id = 'book-pdf-quarantine';

  ASSERT FOUND, 'private quarantine bucket is missing';
  ASSERT bucket_is_private = false, 'quarantine bucket must remain private';
  ASSERT bucket_limit = 52428800, 'quarantine bucket must enforce a 50 MiB limit';
  ASSERT bucket_mimes = ARRAY['application/pdf']::text[],
    'quarantine bucket must allow only application/pdf MIME uploads';

  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload own quarantined book PDFs'
      AND cmd = 'INSERT'
      AND with_check ILIKE '%book-pdf-quarantine%'
      AND with_check ILIKE '%auth.uid%'
  ), 'owner-only quarantine upload policy is missing';

  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can view own quarantined book PDFs'
      AND cmd = 'SELECT'
      AND qual ILIKE '%book-pdf-quarantine%'
      AND qual ILIKE '%auth.uid%'
  ), 'owner-only quarantine read policy is missing';

  ASSERT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = submissions_oid
      AND conname = 'book_pdf_submission_storage_path_matches_id'
  ), 'storage path must be tied to the user and submission IDs';

  ASSERT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = submissions_oid
      AND conname = 'book_pdf_submission_finder_target_required'
  ), 'Finder submissions must require a target book';
END;
$test$;
