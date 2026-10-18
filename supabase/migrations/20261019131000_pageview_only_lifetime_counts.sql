-- Once activity events share website_visits, all traffic totals must count pageviews only.
CREATE OR REPLACE FUNCTION public.get_community_pulse_stats(p_timeframe text DEFAULT '24h'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_timeframe text := lower(coalesce(p_timeframe, '24h'));
  v_period_start timestamptz;
  v_total_signups bigint := 0;
  v_new_signups bigint := 0;
  v_total_visits bigint := 0;
  v_period_visits bigint := 0;
  v_unique_visitors bigint := NULL;
  v_hourly jsonb := '[]'::jsonb;
  v_countries jsonb := '[]'::jsonb;
  v_pages jsonb := '[]'::jsonb;
  v_devices jsonb := '[]'::jsonb;
  v_referrers jsonb := '[]'::jsonb;
  v_reading_engagement jsonb := '{}'::jsonb;
  v_now timestamptz := now();
BEGIN
  IF v_timeframe NOT IN ('24h', '7d', '30d') THEN
    v_timeframe := '24h';
  END IF;

  v_period_start := v_now - CASE v_timeframe
    WHEN '7d' THEN interval '7 days'
    WHEN '30d' THEN interval '30 days'
    ELSE interval '24 hours'
  END;

  SELECT count(*) INTO v_total_signups FROM public.profiles;
  SELECT count(*) INTO v_new_signups FROM public.profiles WHERE created_at >= v_period_start;
  SELECT count(*) INTO v_total_visits FROM public.website_visits WHERE event_type = 'pageview';
  SELECT count(*) INTO v_period_visits
  FROM public.website_visits
  WHERE visited_at >= v_period_start AND event_type = 'pageview';

  SELECT CASE
    WHEN count(*) FILTER (WHERE visitor_id IS NOT NULL OR session_id IS NOT NULL) = 0
      THEN NULL::bigint
    ELSE count(DISTINCT coalesce(visitor_id::text, session_id::text))
  END
  INTO v_unique_visitors
  FROM public.website_visits
  WHERE visited_at >= v_period_start
    AND event_type = 'pageview';

  WITH hours AS (
    SELECT generate_series(0, 23) AS idx
  ), buckets AS (
    SELECT h.idx,
      to_char((v_now AT TIME ZONE 'Asia/Kolkata') - (23 - h.idx) * interval '1 hour', 'FMHH12 AM') AS label,
      count(w.id)::bigint AS amount
    FROM hours h
    LEFT JOIN public.website_visits w
      ON w.visited_at >= v_now - (24 - h.idx) * interval '1 hour'
     AND w.visited_at < v_now - (23 - h.idx) * interval '1 hour'
     AND w.event_type = 'pageview'
    GROUP BY h.idx
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'hourIndex', idx, 'label', label, 'count', amount,
    'isPeak', amount > 0 AND amount = (SELECT max(amount) FROM buckets)
  ) ORDER BY idx), '[]'::jsonb)
  INTO v_hourly FROM buckets;

  SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'code', code, 'count', amount,
    'percent', CASE WHEN v_period_visits > 0 THEN round(amount * 100.0 / v_period_visits)::integer ELSE 0 END)
    ORDER BY amount DESC), '[]'::jsonb)
  INTO v_countries
  FROM (
    SELECT coalesce(nullif(country_code, ''), 'Unknown') AS name,
      nullif(country_code, '') AS code, count(*)::bigint AS amount
    FROM public.website_visits
    WHERE visited_at >= v_period_start AND event_type = 'pageview'
    GROUP BY 1, 2 ORDER BY amount DESC LIMIT 5
  ) country_rows;

  SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'count', amount,
    'percent', CASE WHEN v_period_visits > 0 THEN round(amount * 100.0 / v_period_visits)::integer ELSE 0 END)
    ORDER BY amount DESC), '[]'::jsonb)
  INTO v_pages
  FROM (
    SELECT coalesce(nullif(split_part(split_part(page_url, '?', 1), '#', 1), ''), '/') AS name,
      count(*)::bigint AS amount
    FROM public.website_visits
    WHERE visited_at >= v_period_start AND event_type = 'pageview'
    GROUP BY 1 ORDER BY amount DESC LIMIT 5
  ) page_rows;

  SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'count', amount,
    'percent', CASE WHEN v_period_visits > 0 THEN round(amount * 100.0 / v_period_visits)::integer ELSE 0 END)
    ORDER BY amount DESC), '[]'::jsonb)
  INTO v_devices
  FROM (
    SELECT coalesce(nullif(device_type, ''), 'Unknown') AS name, count(*)::bigint AS amount
    FROM public.website_visits
    WHERE visited_at >= v_period_start AND event_type = 'pageview'
    GROUP BY 1 ORDER BY amount DESC LIMIT 4
  ) device_rows;

  SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'count', amount,
    'percent', CASE WHEN v_period_visits > 0 THEN round(amount * 100.0 / v_period_visits)::integer ELSE 0 END)
    ORDER BY amount DESC), '[]'::jsonb)
  INTO v_referrers
  FROM (
    SELECT coalesce(nullif(split_part(split_part(referrer, '/', 3), ':', 1), ''), 'Direct') AS name,
      count(*)::bigint AS amount
    FROM public.website_visits
    WHERE visited_at >= v_period_start AND event_type = 'pageview'
    GROUP BY 1 ORDER BY amount DESC LIMIT 5
  ) referrer_rows;

  SELECT jsonb_build_object(
    'bookViews', (
      SELECT count(*) FROM public.website_visits
      WHERE visited_at >= v_period_start AND event_type = 'activity'
        AND event_name IN ('book_opened', 'discovery_book_opened')
    ),
    'readingProgressUpdates', (
      SELECT count(*) FROM public.reading_room_events
      WHERE created_at >= v_period_start AND kind = 'chapter_complete'
    ),
    'groupJoins', (
      SELECT count(*) FROM public.group_members WHERE joined_at >= v_period_start
    ),
    'discussions', (
      SELECT count(*) FROM public.posts WHERE created_at >= v_period_start
    ) + (
      SELECT count(*) FROM public.post_comments WHERE created_at >= v_period_start
    )
  ) INTO v_reading_engagement;

  RETURN jsonb_build_object(
    'timeframe', v_timeframe,
    'totalSignups', v_total_signups,
    'newSignups24h', v_new_signups,
    'totalVisits', v_total_visits,
    'last24hVisits', v_period_visits,
    'uniqueVisitors24h', v_unique_visitors,
    'avgTimeOnSite', '—',
    'hourlyActivity', v_hourly,
    'topCountries', v_countries,
    'topPages', v_pages,
    'devices', v_devices,
    'referrers', v_referrers,
    'readingEngagement', v_reading_engagement,
    'lastUpdated', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_website_visit_count()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.website_visits WHERE event_type = 'pageview');
END;
$function$
;

COMMENT ON FUNCTION public.get_website_visit_count() IS
  'Returns the lifetime count of pageview events only; product/UI activity events are not visits.';
