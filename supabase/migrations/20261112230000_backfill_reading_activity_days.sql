-- Backfill best-effort historical activity from legacy progress timestamps.
-- Legacy updated_at is mutable and cannot reconstruct every historical session.
-- UTC dates are used because historical user timezones were not stored.
-- This migration is idempotent and intentionally does not change streak reads.

INSERT INTO public.reading_activity_days (
  user_id,
  activity_date,
  timezone,
  first_activity_at,
  last_activity_at,
  source
)
SELECT
  user_id,
  (updated_at AT TIME ZONE 'UTC')::date AS activity_date,
  'UTC' AS timezone,
  MIN(updated_at) AS first_activity_at,
  MAX(updated_at) AS last_activity_at,
  'progress_save' AS source
FROM public.detailed_reading_progress
WHERE user_id IS NOT NULL
  AND updated_at IS NOT NULL
GROUP BY user_id, (updated_at AT TIME ZONE 'UTC')::date
ON CONFLICT (user_id, activity_date) DO NOTHING;

COMMENT ON TABLE public.reading_activity_days IS
  'Deduplicated daily reading activity. Legacy backfill uses UTC dates and is an approximation; streak reads must not switch until timezone/cutover review.';
