-- Durable, deduplicated daily reading activity for streaks.
-- A day is recorded only after a successful explicit reading-progress action.
CREATE TABLE IF NOT EXISTS public.reading_activity_days (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  first_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'progress_save'
    CHECK (source IN ('progress_save', 'chapter_complete')),
  PRIMARY KEY (user_id, activity_date)
);

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

CREATE INDEX IF NOT EXISTS reading_activity_days_user_date_idx
  ON public.reading_activity_days (user_id, activity_date DESC);
