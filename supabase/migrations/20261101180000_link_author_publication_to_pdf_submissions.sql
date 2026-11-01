-- Link author dashboard publications to the existing private PDF review queue.
-- Author manuscripts remain private until the existing admin review workflow publishes them.
BEGIN;

ALTER TABLE public.book_pdf_submissions
  ADD COLUMN IF NOT EXISTS author_publication_id uuid
    REFERENCES public.user_published_books(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_book_pdf_submissions_author_publication_id
  ON public.book_pdf_submissions (author_publication_id)
  WHERE author_publication_id IS NOT NULL;

-- Covers are public assets; manuscripts must use book-pdf-quarantine instead.
DROP POLICY IF EXISTS "Authors can upload own publication covers" ON storage.objects;
CREATE POLICY "Authors can upload own publication covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'books'
    AND (storage.foldername(name))[1] = 'covers'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    AND array_length(storage.foldername(name), 1) = 3
    AND storage.filename(name) ~ '^cover\.(jpg|jpeg|png|webp)$'
  );

DROP POLICY IF EXISTS "Authors can delete own publication covers" ON storage.objects;
CREATE POLICY "Authors can delete own publication covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'books'
    AND (storage.foldername(name))[1] = 'covers'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    AND array_length(storage.foldername(name), 1) = 3
    AND storage.filename(name) ~ '^cover\.(jpg|jpeg|png|webp)$'
  );

COMMIT;
