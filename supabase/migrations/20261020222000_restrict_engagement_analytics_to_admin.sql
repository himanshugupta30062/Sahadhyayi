
-- Engagement aggregates are part of the admin analytics dashboard. Do not expose even
-- aggregate session-duration metrics through a public RPC.
CREATE OR REPLACE FUNCTION public.get_website_engagement_stats(p_timeframe text DEFAULT '24h')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_duration interval;
  v_start timestamptz;
  v_total_seconds bigint := 0;
  v_sessions bigint := 0;
  v_average numeric := NULL;
  v_average_page numeric := NULL;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  IF lower(coalesce(p_timeframe, '24h')) = '7d' THEN
    v_duration := interval '7 days';
  ELSIF lower(coalesce(p_timeframe, '24h')) = '30d' THEN
    v_duration := interval '30 days';
  ELSE
    v_duration := interval '24 hours';
  END IF;
  v_start := now() - v_duration;

  SELECT coalesce(sum(engaged_seconds), 0), count(DISTINCT session_id)
    INTO v_total_seconds, v_sessions
  FROM public.website_engagement_events
  WHERE created_at >= v_start AND created_at <= now();

  IF v_sessions > 0 THEN
    v_average := round(v_total_seconds::numeric / v_sessions, 1);
  END IF;

  SELECT round(avg(page_seconds)::numeric, 1)
    INTO v_average_page
  FROM (
    SELECT session_id, page_path, sum(engaged_seconds)::numeric AS page_seconds
    FROM public.website_engagement_events
    WHERE created_at >= v_start AND created_at <= now()
    GROUP BY session_id, page_path
  ) AS page_totals;

  RETURN jsonb_build_object(
    'status', CASE WHEN v_sessions > 0 THEN 'available' ELSE 'not_tracked_yet' END,
    'definition', 'Sum of visible-tab engagement heartbeats after recent user interaction; hidden and idle time excluded; maximum 15 seconds per sample.',
    'engaged_seconds', v_total_seconds,
    'measured_sessions', v_sessions,
    'average_seconds_per_session', v_average,
    'average_seconds_per_page', v_average_page,
    'sample_count', (SELECT count(*) FROM public.website_engagement_events WHERE created_at >= v_start AND created_at <= now()),
    'retention_days', 30
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_website_engagement_stats(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_website_engagement_stats(text) TO authenticated, service_role;

REVOKE ALL ON TABLE public.website_engagement_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.website_engagement_events TO service_role;
