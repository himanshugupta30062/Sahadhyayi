-- Reader experience metadata: mood, pacing, and content warnings.
-- Private per-reader input; book-level aggregates will be exposed only through
-- a dedicated, privacy-safe RPC in a follow-up migration.
CREATE TABLE IF NOT EXISTS public.book_experience_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books_library(id) ON DELETE CASCADE,
  moods text[] NOT NULL DEFAULT '{}'::text[],
  pacing text CHECK (pacing IS NULL OR pacing IN ('fast', 'medium', 'slow')),
  content_warnings text[] NOT NULL DEFAULT '{}'::text[],
  custom_warning text CHECK (custom_warning IS NULL OR char_length(custom_warning) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT book_experience_tags_user_book_unique UNIQUE (user_id, book_id),
  CONSTRAINT book_experience_tags_moods_valid CHECK (
    moods <@ ARRAY[
      'dark','hopeful','funny','sad','inspiring','reflective',
      'adventurous','romantic','tense','comforting','mysterious','challenging'
    ]::text[]
  ),
  CONSTRAINT book_experience_tags_warnings_valid CHECK (
    content_warnings <@ ARRAY[
      'violence','sexual violence','abuse','grief','death','suicide',
      'self-harm','substance use','discrimination','war','illness','animal harm'
    ]::text[]
  )
);

CREATE INDEX IF NOT EXISTS book_experience_tags_book_idx
  ON public.book_experience_tags (book_id);

CREATE INDEX IF NOT EXISTS book_experience_tags_user_updated_idx
  ON public.book_experience_tags (user_id, updated_at DESC);

ALTER TABLE public.book_experience_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Readers manage own experience tags" ON public.book_experience_tags;
CREATE POLICY "Readers manage own experience tags"
  ON public.book_experience_tags
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id;

COMMENT ON TABLE public.book_experience_tags IS
  'Private reader mood, pacing, and content-warning selections for a book. Aggregates require a separate privacy-safe RPC.';
