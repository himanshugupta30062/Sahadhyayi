-- Add a fourth bookshelf state for books readers chose not to finish.
-- Keep existing rows and statuses unchanged.
ALTER TABLE public.user_bookshelf
  DROP CONSTRAINT IF EXISTS user_bookshelf_status_check;

ALTER TABLE public.user_bookshelf
  ADD CONSTRAINT user_bookshelf_status_check
  CHECK (status IN ('want_to_read', 'reading', 'completed', 'dnf'));
