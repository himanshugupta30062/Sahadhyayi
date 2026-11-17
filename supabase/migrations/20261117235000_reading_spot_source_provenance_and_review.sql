-- Track provenance and review status for public Explore Map places.
-- Existing hand-curated seed records remain verified; all future imports default to review.

ALTER TABLE public.reading_spots
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

UPDATE public.reading_spots
SET source = COALESCE(source, 'curated'),
    verification_status = CASE WHEN is_verified THEN 'verified' ELSE 'pending_review' END,
    last_verified_at = CASE WHEN is_verified THEN COALESCE(last_verified_at, updated_at, created_at, now()) ELSE NULL END
WHERE source IS NULL OR verification_status IS NULL OR
      (is_verified AND verification_status <> 'verified');

ALTER TABLE public.reading_spots
  ALTER COLUMN is_verified SET DEFAULT false,
  ALTER COLUMN verification_status SET DEFAULT 'pending_review';

ALTER TABLE public.reading_spots
  DROP CONSTRAINT IF EXISTS reading_spots_verification_status_check;

ALTER TABLE public.reading_spots
  ADD CONSTRAINT reading_spots_verification_status_check
  CHECK (verification_status IN ('pending_review', 'verified', 'rejected'));

ALTER TABLE public.reading_spots
  DROP CONSTRAINT IF EXISTS reading_spots_verification_consistency_check;

ALTER TABLE public.reading_spots
  ADD CONSTRAINT reading_spots_verification_consistency_check
  CHECK (
    (is_verified AND verification_status = 'verified')
    OR (NOT is_verified AND verification_status IN ('pending_review', 'rejected'))
  );

CREATE UNIQUE INDEX IF NOT EXISTS reading_spots_source_identity_uidx
  ON public.reading_spots (source, source_id)
  WHERE source IS NOT NULL AND source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS reading_spots_review_queue_idx
  ON public.reading_spots (verification_status, created_at DESC)
  WHERE verification_status = 'pending_review';

CREATE INDEX IF NOT EXISTS reading_spots_source_idx
  ON public.reading_spots (source, category);

COMMENT ON COLUMN public.reading_spots.source IS
  'Provenance namespace, e.g. curated, openstreetmap, or a government open-data publisher.';
COMMENT ON COLUMN public.reading_spots.source_id IS
  'Stable identifier within the source namespace; used for idempotent imports.';
COMMENT ON COLUMN public.reading_spots.source_url IS
  'Canonical source record URL for attribution and reviewer verification.';
COMMENT ON COLUMN public.reading_spots.verification_status IS
  'pending_review places are private to admins; only verified places are exposed by Explore Map.';
COMMENT ON COLUMN public.reading_spots.last_verified_at IS
  'Timestamp when a human/admin last verified this place record.';

NOTIFY pgrst, 'reload schema';
