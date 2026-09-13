ALTER TABLE public.reading_progress
  ADD COLUMN IF NOT EXISTS book_id uuid REFERENCES public.books_library(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS reading_progress_user_book_unique
  ON public.reading_progress (user_id, book_id);

CREATE INDEX IF NOT EXISTS reading_progress_book_id_idx
  ON public.reading_progress (book_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_progress TO authenticated;
GRANT ALL ON public.reading_progress TO service_role;