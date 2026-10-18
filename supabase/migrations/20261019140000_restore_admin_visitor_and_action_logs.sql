-- Restore the admin-only recent-visits RPC expected by Live Website Stats, and expose
-- a separately filtered admin-only action log. Activity events never appear in pageview counts.

DROP FUNCTION IF EXISTS public.get_admin_recent_visits(int, text);

CREATE OR REPLACE FUNCTION public.get_admin_recent_visits(
  p_limit int DEFAULT 100,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  visited_at timestamptz,
  ip_address text,
  country_code text,
  city text,
  region text,
  page_url text,
  browser text,
  browser_version text,
  os text,
  device_type text,
  device_model text,
  referrer text,
  screen_resolution text,
  language text,
  visitor_id uuid,
  session_id uuid,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_search text := nullif(left(btrim(p_search), 200), '');
  v_limit integer := least(greatest(coalesce(p_limit, 100), 1), 200);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view visitor analytics.';
  END IF;

  RETURN QUERY
  SELECT
    v.id,
    v.visited_at,
    coalesce(v.ip_address::text, 'Unknown') AS ip_address,
    v.country_code,
    v.city,
    v.region,
    v.page_url,
    v.browser,
    v.browser_version,
    v.os,
    v.device_type,
    v.device_model,
    v.referrer,
    v.screen_resolution,
    v.language,
    v.visitor_id,
    v.session_id,
    v.user_id
  FROM public.website_visits v
  WHERE v.event_type = 'pageview'
    AND (
      v_search IS NULL
      OR v.ip_address::text ILIKE '%' || v_search || '%'
      OR coalesce(v.city, '') ILIKE '%' || v_search || '%'
      OR coalesce(v.country_code, '') ILIKE '%' || v_search || '%'
      OR coalesce(v.page_url, '') ILIKE '%' || v_search || '%'
      OR coalesce(v.referrer, '') ILIKE '%' || v_search || '%'
      OR coalesce(v.visitor_id::text, '') ILIKE '%' || v_search || '%'
    )
  ORDER BY v.visited_at DESC
  LIMIT v_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_recent_visits(int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_recent_visits(int, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_admin_recent_actions(
  p_limit int DEFAULT 50,
  p_timeframe text DEFAULT '24h'
)
RETURNS TABLE (
  id bigint,
  visited_at timestamptz,
  event_name text,
  page_url text,
  visitor_id uuid,
  session_id uuid,
  user_id uuid,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_timeframe text := lower(coalesce(p_timeframe, '24h'));
  v_period_start timestamptz;
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view action analytics.';
  END IF;

  IF v_timeframe NOT IN ('24h', '7d', '30d') THEN
    v_timeframe := '24h';
  END IF;

  v_period_start := now() - CASE v_timeframe
    WHEN '7d' THEN interval '7 days'
    WHEN '30d' THEN interval '30 days'
    ELSE interval '24 hours'
  END;

  RETURN QUERY
  SELECT
    v.id,
    v.visited_at,
    v.event_name,
    v.page_url,
    v.visitor_id,
    v.session_id,
    v.user_id,
    coalesce(v.metadata, '{}'::jsonb) AS metadata
  FROM public.website_visits v
  WHERE v.event_type = 'activity'
    AND v.visited_at >= v_period_start
    AND v.visited_at <= now()
  ORDER BY v.visited_at DESC
  LIMIT v_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_recent_actions(int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_recent_actions(int, text) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_admin_recent_visits(int, text) IS
  'Admin-only recent pageview records. Excludes UI/product activity events.';
COMMENT ON FUNCTION public.get_admin_recent_actions(int, text) IS
  'Admin-only recent action event log, separate from pageviews and aggregate traffic counts.';
