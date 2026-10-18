-- Keep the legacy admin visit-statistics RPC correct after the table also stores activity events.
-- The current schema uses visited_at; the old function referenced a nonexistent created_at column.
CREATE OR REPLACE FUNCTION public.get_visit_statistics()
RETURNS TABLE(
  total_visits BIGINT,
  unique_countries BIGINT,
  visits_today BIGINT,
  visits_this_week BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_today_start timestamptz := date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';
  v_week_start timestamptz := (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata') - interval '7 days';
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    count(*) FILTER (WHERE event_type = 'pageview')::bigint AS total_visits,
    count(DISTINCT country_code) FILTER (
      WHERE event_type = 'pageview' AND nullif(btrim(country_code), '') IS NOT NULL
    )::bigint AS unique_countries,
    count(*) FILTER (
      WHERE event_type = 'pageview' AND visited_at >= v_today_start
    )::bigint AS visits_today,
    count(*) FILTER (
      WHERE event_type = 'pageview' AND visited_at >= v_week_start
    )::bigint AS visits_this_week
  FROM public.website_visits;
END;
$function$;

COMMENT ON FUNCTION public.get_visit_statistics() IS
  'Admin-only visit statistics. Counts pageview events only; excludes UI/product activity events.';
