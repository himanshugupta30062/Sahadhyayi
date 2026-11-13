-- Migration: Add DNF (Did Not Finish) details and Up Next reading queue to user_bookshelf

ALTER TABLE public.user_bookshelf
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dnf_page INTEGER,
  ADD COLUMN IF NOT EXISTS dnf_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dnf_reason TEXT,
  ADD COLUMN IF NOT EXISTS dnf_notes TEXT,
  ADD COLUMN IF NOT EXISTS up_next_position INTEGER;

-- Check constraints for valid DNF and Up Next attributes
ALTER TABLE public.user_bookshelf
  DROP CONSTRAINT IF EXISTS user_bookshelf_dnf_page_check;
ALTER TABLE public.user_bookshelf
  ADD CONSTRAINT user_bookshelf_dnf_page_check
  CHECK (dnf_page IS NULL OR dnf_page >= 0);

ALTER TABLE public.user_bookshelf
  DROP CONSTRAINT IF EXISTS user_bookshelf_dnf_reason_check;
ALTER TABLE public.user_bookshelf
  ADD CONSTRAINT user_bookshelf_dnf_reason_check
  CHECK (dnf_reason IS NULL OR dnf_reason IN ('pacing_too_slow', 'writing_style', 'not_what_expected', 'content_trigger', 'lost_interest', 'other'));

ALTER TABLE public.user_bookshelf
  DROP CONSTRAINT IF EXISTS user_bookshelf_up_next_position_check;
ALTER TABLE public.user_bookshelf
  ADD CONSTRAINT user_bookshelf_up_next_position_check
  CHECK (up_next_position IS NULL OR (up_next_position >= 1 AND up_next_position <= 5));

-- Partial unique index ensures up to 5 unique ordered positions per user
CREATE UNIQUE INDEX IF NOT EXISTS user_bookshelf_user_up_next_idx
  ON public.user_bookshelf (user_id, up_next_position)
  WHERE up_next_position IS NOT NULL;

-- Index for fast status and DNF analytics queries
CREATE INDEX IF NOT EXISTS user_bookshelf_user_status_dnf_idx
  ON public.user_bookshelf (user_id, status, dnf_date);

COMMENT ON COLUMN public.user_bookshelf.dnf_page IS 'Page where the reader stopped reading before abandoning the book.';
COMMENT ON COLUMN public.user_bookshelf.dnf_date IS 'Timestamp when the reader marked the book as Did Not Finish.';
COMMENT ON COLUMN public.user_bookshelf.dnf_reason IS 'Categorized reason for abandoning: pacing_too_slow, writing_style, not_what_expected, content_trigger, lost_interest, other.';
COMMENT ON COLUMN public.user_bookshelf.dnf_notes IS 'Optional private reflection note for abandoning the book.';
COMMENT ON COLUMN public.user_bookshelf.up_next_position IS 'Rank 1 to 5 in the user personal Up Next reading queue; null if not queued.';
