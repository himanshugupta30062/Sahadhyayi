-- Record reading lifecycle dates on each user's progress entry.
ALTER TABLE public.reading_progress
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Backfill a sensible start date for existing progress records.
UPDATE public.reading_progress
SET started_at = COALESCE(started_at, created_at, now())
WHERE started_at IS NULL;

COMMENT ON COLUMN public.reading_progress.started_at IS 'When the user first began tracking this book.';
COMMENT ON COLUMN public.reading_progress.completed_at IS 'When progress first reached the final page; null while in progress.';
