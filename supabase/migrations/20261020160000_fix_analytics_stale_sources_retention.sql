-- Repair stale analytics sources and enforce rolling 30-day retention.
-- Admin visitor listing must read the active ingestion table, not the unused legacy action table.
CREATE OR REPLACE FUNCTION public.get_admin_recent_visits(
  p_limit integer DEFAULT 100,
  p_search text DEFAULT NULL::text
)
RETURNS TABLE(
  id bigint,
  visited_at timestamp with time zone,
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
SET search_path TO 'public', 'pg_temp'
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
    NULL::text AS ip_address,
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
  WHERE coalesce(v.event_type, 'pageview') IN ('pageview', 'page_view', 'view')
    AND (
      v_search IS NULL
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

-- The rolling event table is intended to contain no more than 30 days of events.
DELETE FROM public.website_visit_events
WHERE created_at < now() - interval '30 days';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'purge-website-visit-events-30d'
  ) THEN
    PERFORM cron.schedule(
      'purge-website-visit-events-30d',
      '23 3 * * *',
      $command$DELETE FROM public.website_visit_events WHERE created_at < now() - interval '30 days';$command$
    );
  END IF;
END;
$$;

-- Keep the field named last24hVisits truly tied to the 24-hour window,
-- even when the dashboard's selected timeframe is 7d or 30d.
DO $$
DECLARE
  v_definition text;
BEGIN
  v_definition := pg_get_functiondef('public.get_dual_table_website_analytics(text)'::regprocedure);
  IF position('''last24hVisits'',v_recent' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'Expected last24hVisits expression was not found; refusing to modify analytics function';
  END IF;
  v_definition := replace(
    v_definition,
    '''last24hVisits'',v_recent',
    '''last24hVisits'',v_views24'
  );
  EXECUTE v_definition;
END;
$$;
