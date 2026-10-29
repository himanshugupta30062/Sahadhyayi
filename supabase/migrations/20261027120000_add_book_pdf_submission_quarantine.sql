-- Additive foundation for AI-assisted PDF intake.
-- Does not modify books_library, existing public books bucket, or current search/save paths.
-- Apply only after review in a non-production environment.

BEGIN;

CREATE TABLE IF NOT EXISTS public.book_pdf_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_book_id uuid NULL REFERENCES public.books_library(id) ON DELETE SET NULL,
  submission_source text NOT NULL DEFAULT 'user_upload'
    CHECK (submission_source IN ('user_upload', 'ultimate_book_finder')),
  original_filename text NOT NULL
    CHECK (char_length(btrim(original_filename)) BETWEEN 1 AND 255),
  storage_path text NOT NULL UNIQUE,
  file_size_bytes bigint NULL CHECK (file_size_bytes IS NULL OR file_size_bytes BETWEEN 1 AND 52428800),
  sha256 text NULL CHECK (sha256 IS NULL OR sha256 ~ '^[a-f0-9]{64}$'),
  submitted_title text NULL CHECK (submitted_title IS NULL OR char_length(submitted_title) <= 500),
  submitted_author text NULL CHECK (submitted_author IS NULL OR char_length(submitted_author) <= 500),
  rights_attested boolean NOT NULL DEFAULT false,
  rights_statement text NULL CHECK (rights_statement IS NULL OR char_length(rights_statement) <= 2000),
  status text NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'queued', 'scanning', 'extracting', 'matching', 'needs_review', 'approved', 'rejected', 'failed')),
  detected_metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(detected_metadata) = 'object'),
  validation_findings jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(validation_findings) = 'array'),
  match_confidence numeric(5,4) NULL CHECK (match_confidence IS NULL OR match_confidence BETWEEN 0 AND 1),
  reviewed_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz NULL,
  rejection_reason text NULL CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT book_pdf_submission_storage_path_matches_id
    CHECK (storage_path = user_id::text || '/' || id::text || '/source.pdf'),
  CONSTRAINT book_pdf_submission_finder_target_required
    CHECK (submission_source <> 'ultimate_book_finder' OR target_book_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_book_pdf_submissions_user_created
  ON public.book_pdf_submissions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_pdf_submissions_status_created
  ON public.book_pdf_submissions (status, created_at);
CREATE INDEX IF NOT EXISTS idx_book_pdf_submissions_target
  ON public.book_pdf_submissions (target_book_id)
  WHERE target_book_id IS NOT NULL;

ALTER TABLE public.book_pdf_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own PDF submissions" ON public.book_pdf_submissions;
CREATE POLICY "Users can view own PDF submissions"
  ON public.book_pdf_submissions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all PDF submissions" ON public.book_pdf_submissions;
CREATE POLICY "Admins can view all PDF submissions"
  ON public.book_pdf_submissions FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::text));

DROP POLICY IF EXISTS "Users can create own PDF submissions" ON public.book_pdf_submissions;
CREATE POLICY "Users can create own PDF submissions"
  ON public.book_pdf_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND rights_attested = true
    AND status = 'uploaded'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND match_confidence IS NULL
    AND detected_metadata = '{}'::jsonb
    AND validation_findings = '[]'::jsonb
    AND storage_path = user_id::text || '/' || id::text || '/source.pdf'
    AND (
      (submission_source = 'user_upload' AND target_book_id IS NULL)
      OR
      (submission_source = 'ultimate_book_finder' AND target_book_id IS NOT NULL)
    )
  );

-- Intentionally no client UPDATE policy: status, validation findings and approvals
-- can only be changed by a trusted server-side worker/admin path.
-- Intentionally no public SELECT policy: submissions are private until reviewed.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('book-pdf-quarantine', 'book-pdf-quarantine', false, 52428800, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;

-- Fail closed if this bucket name already exists with weaker settings; never
-- silently mutate an existing bucket as a side effect of this feature migration.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'book-pdf-quarantine'
      AND public = false
      AND file_size_limit = 52428800
      AND allowed_mime_types = ARRAY['application/pdf']::text[]
  ) THEN
    RAISE EXCEPTION 'book-pdf-quarantine already exists with unexpected security settings';
  END IF;
END;
$$;
DROP POLICY IF EXISTS "Users can upload own quarantined book PDFs" ON storage.objects;
CREATE POLICY "Users can upload own quarantined book PDFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'book-pdf-quarantine'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND array_length(storage.foldername(name), 1) = 2
    AND storage.filename(name) = 'source.pdf'
  );

DROP POLICY IF EXISTS "Users can view own quarantined book PDFs" ON storage.objects;
CREATE POLICY "Users can view own quarantined book PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'book-pdf-quarantine'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

COMMIT;
