-- Add Did Not Finish (DNF) as a first-class bookshelf state.
-- Existing rows and the unique (user_id, book_id) relationship remain unchanged.
ALTER TABLE public.user_bookshelf
  DROP CONSTRAINT IF EXISTS user_bookshelf_status_check;

ALTER TABLE public.user_bookshelf
  ADD CONSTRAINT user_bookshelf_status_check
  CHECK (status IN ('want_to_read', 'reading', 'completed', 'dnf'));

COMMENT ON COLUMN public.user_bookshelf.status IS
  'Reader shelf state: want_to_read, reading, completed, or dnf.';
