-- Restore city-level aggregate fields for the Community Stats view.
-- Returns only grouped pageview counts, never individual visitor rows.
CREATE OR REPLACE FUNCTION public.get_community_pulse_city_stats(
  p_timeframe text DEFAULT '24h'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_timeframe text := lower(coalesce(p_timeframe, '24h'));
  v_now timestamptz := now();
  v_period_start timestamptz;
  v_top_cities jsonb := '[]'::jsonb;
  v_top_city_24h jsonb := NULL;
BEGIN
  IF v_timeframe NOT IN ('24h', '7d', '30d') THEN
    v_timeframe := '24h';
  END IF;

  v_period_start := v_now - CASE v_timeframe
    WHEN '7d' THEN interval '7 days'
    WHEN '30d' THEN interval '30 days'
    ELSE interval '24 hours'
  END;

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object('name', city_label, 'count', visit_count)
      ORDER BY visit_count DESC, city_label ASC
    ),
    '[]'::jsonb
  )
  INTO v_top_cities
  FROM (
    SELECT
      CASE
        WHEN nullif(trim(region), '') IS NOT NULL
          AND trim(region) <> 'Unknown'
        THEN trim(city) || ', ' || trim(region)
        ELSE trim(city)
      END AS city_label,
      count(*)::bigint AS visit_count
    FROM public.website_visits
    WHERE event_type = 'pageview'
      AND visited_at >= v_period_start
      AND visited_at <= v_now
      AND nullif(trim(city), '') IS NOT NULL
      AND trim(city) <> 'Unknown'
    GROUP BY 1
    ORDER BY visit_count DESC, city_label ASC
    LIMIT 10
  ) city_rows;

  SELECT jsonb_build_object('name', city_label, 'count', visit_count)
  INTO v_top_city_24h
  FROM (
    SELECT
      CASE
        WHEN nullif(trim(region), '') IS NOT NULL
          AND trim(region) <> 'Unknown'
        THEN trim(city) || ', ' || trim(region)
        ELSE trim(city)
      END AS city_label,
      count(*)::bigint AS visit_count
    FROM public.website_visits
    WHERE event_type = 'pageview'
      AND visited_at >= v_now - interval '24 hours'
      AND visited_at <= v_now
      AND nullif(trim(city), '') IS NOT NULL
      AND trim(city) <> 'Unknown'
    GROUP BY 1
    ORDER BY visit_count DESC, city_label ASC
    LIMIT 1
  ) city_24h_rows;

  RETURN jsonb_build_object(
    'timeframe', v_timeframe,
    'topCities', v_top_cities,
    'mostVisitedCity24h', v_top_city_24h,
    'lastUpdated', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_pulse_city_stats(text)
  TO anon, authenticated, service_role;
