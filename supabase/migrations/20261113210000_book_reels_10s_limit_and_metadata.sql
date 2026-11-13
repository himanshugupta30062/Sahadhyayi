-- Add mandatory 10-second duration constraint, tags, visibility, and book_id to book_reels
ALTER TABLE public.book_reels
  ADD COLUMN IF NOT EXISTS duration_seconds numeric(5,2),
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS book_id text REFERENCES public.books_library(id) ON DELETE SET NULL;

-- Enforce strict 10-second maximum duration (with 0.5s tolerance for encoding audio-tail padding)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'book_reels_duration_limit_check'
  ) THEN
    ALTER TABLE public.book_reels
      ADD CONSTRAINT book_reels_duration_limit_check
      CHECK (duration_seconds IS NULL OR (duration_seconds > 0 AND duration_seconds <= 10.5));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'book_reels_visibility_check'
  ) THEN
    ALTER TABLE public.book_reels
      ADD CONSTRAINT book_reels_visibility_check
      CHECK (visibility IN ('public', 'unlisted', 'friends'));
  END IF;
END $$;

-- Indexes for performance and tag discovery
CREATE INDEX IF NOT EXISTS book_reels_visibility_idx ON public.book_reels(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS book_reels_book_id_idx ON public.book_reels(book_id) WHERE book_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS book_reels_tags_idx ON public.book_reels USING gin(tags);

-- RLS Update: allow public reels for all, and private/unlisted for the owner
DROP POLICY IF EXISTS "Anyone can view published book reels" ON public.book_reels;
CREATE POLICY "Anyone can view published book reels" ON public.book_reels
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);
