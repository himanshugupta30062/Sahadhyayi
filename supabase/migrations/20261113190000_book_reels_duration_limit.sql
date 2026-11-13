-- Persist and constrain Book Reel duration so clients cannot publish >10s reels.
ALTER TABLE public.book_reels
  ADD COLUMN IF NOT EXISTS duration_seconds numeric(6,3);

ALTER TABLE public.book_reels
  DROP CONSTRAINT IF EXISTS book_reels_duration_seconds_check;
ALTER TABLE public.book_reels
  ADD CONSTRAINT book_reels_duration_seconds_check
  CHECK (duration_seconds IS NULL OR (duration_seconds > 0 AND duration_seconds <= 10));
