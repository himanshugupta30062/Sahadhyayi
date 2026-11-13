-- Track physical/digital ownership independently from reading status.
ALTER TABLE public.user_bookshelf
  ADD COLUMN IF NOT EXISTS is_owned BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.user_bookshelf.is_owned IS
  'Whether the user owns a copy of this book; independent of reading status.';
