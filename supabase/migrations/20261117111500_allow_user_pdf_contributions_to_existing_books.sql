-- Allow reader contributions to target an existing catalogue book.
-- The contribution dialog supports linking a PDF to an existing book, but the
-- previous INSERT policy rejected every user_upload with target_book_id set.
DROP POLICY IF EXISTS "Users can create own PDF submissions" ON public.book_pdf_submissions;

CREATE POLICY "Users can create own PDF submissions"
ON public.book_pdf_submissions
FOR INSERT
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
  AND storage_path = (
    user_id::text || '/'::text || id::text || '/source.pdf'::text
  )
  AND (
    submission_source = 'user_upload'
    OR (
      submission_source = 'ultimate_book_finder'
      AND target_book_id IS NOT NULL
    )
  )
);
