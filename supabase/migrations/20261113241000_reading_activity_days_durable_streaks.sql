-- Migration: Durable reading activity days schema updates for accurate streaks (#1506)
-- Ensures table has created_at, optional book_id, and broadened source types.

-- 1. Add created_at and book_id if not already present
ALTER TABLE public.reading_activity_days
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES public.books_library(id) ON DELETE SET NULL;

-- 2. Broaden source check constraint if existing
ALTER TABLE public.reading_activity_days
  DROP CONSTRAINT IF EXISTS reading_activity_days_source_check;

ALTER TABLE public.reading_activity_days
  ADD CONSTRAINT reading_activity_days_source_check
  CHECK (source IN ('progress_save', 'chapter_complete', 'reading_log', 'bookshelf_status', 'legacy_backfill'));

-- 3. Ensure RLS policies are strictly enforced for owner only (no public or cross-user access)
ALTER TABLE public.reading_activity_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own reading activity days" ON public.reading_activity_days;
CREATE POLICY "Users read own reading activity days"
  ON public.reading_activity_days FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own reading activity days" ON public.reading_activity_days;
CREATE POLICY "Users insert own reading activity days"
  ON public.reading_activity_days FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own reading activity days" ON public.reading_activity_days;
CREATE POLICY "Users update own reading activity days"
  ON public.reading_activity_days FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Restrict DELETE: no delete policy by default, ensuring append-oriented durability.

-- 4. Ensure index on user_id and activity_date exists for fast descending scans
CREATE INDEX IF NOT EXISTS reading_activity_days_user_date_idx
  ON public.reading_activity_days (user_id, activity_date DESC);

COMMENT ON TABLE public.reading_activity_days IS
  'Append-oriented durable daily reading activity table keyed by (user_id, activity_date), supporting accurate lifetime streaks and activity tracking.';
