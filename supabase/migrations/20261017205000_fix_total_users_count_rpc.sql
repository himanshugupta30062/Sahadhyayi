-- Migration: Fix get_total_users_count and community pulse aggregates to query real database accounts from auth.users

-- 1. Fix get_total_users_count to count real registered users directly from auth.users
CREATE OR REPLACE FUNCTION public.get_total_users_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  -- Attempt to count directly from auth.users
  BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.users;
  EXCEPTION WHEN OTHERS THEN
    v_count := NULL;
  END;

  -- If auth.users count is unavailable or 0, fallback to public.profiles
  IF v_count IS NULL OR v_count = 0 THEN
    SELECT COUNT(*) INTO v_count FROM public.profiles;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_total_users_count() TO anon, authenticated, service_role;

-- 2. Backfill public.profiles for all registered auth.users so any query or join to public.profiles stays consistent
INSERT INTO public.profiles (id, full_name, username)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'Reader'),
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1) || '_' || substr(u.id::text, 1, 4))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Update get_community_pulse_stats to count auth.users and grant execute to anon, authenticated, service_role
CREATE OR REPLACE FUNCTION public.get_community_pulse_stats(p_timeframe text DEFAULT '24h')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_timeframe text := lower(coalesce(p_timeframe, '24h'));
  v_period_start timestamptz;
  v_total_signups bigint := 0;
  v_new_signups bigint := 0;
  v_total_visits bigint := 0;
  v_period_visits bigint := 0;
  v_unique_visitors bigint := 0;
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

  -- Read real live user counts directly from auth.users
  BEGIN
    SELECT count(*) INTO v_total_signups FROM auth.users;
    SELECT count(*) INTO v_new_signups FROM auth.users WHERE created_at >= v_period_start;
  EXCEPTION WHEN OTHERS THEN
    SELECT count(*) INTO v_total_signups FROM public.profiles;
    SELECT count(*) INTO v_new_signups FROM public.profiles WHERE created_at >= v_period_start;
  END;

  IF v_total_signups = 0 THEN
    SELECT count(*) INTO v_total_signups FROM public.profiles;
  END IF;

  SELECT count(*) INTO v_total_visits FROM public.website_visits;
  SELECT count(*) INTO v_period_visits FROM public.website_visits
    WHERE visited_at >= v_period_start;
  SELECT count(DISTINCT coalesce(visitor_id::text, session_id::text)) INTO v_unique_visitors
    FROM public.website_visits
    WHERE visited_at >= v_period_start
      AND (visitor_id IS NOT NULL OR session_id IS NOT NULL);

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
    WHERE visited_at >= v_period_start
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
    WHERE visited_at >= v_period_start
    GROUP BY 1 ORDER BY amount DESC LIMIT 5
  ) page_rows;

  SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'count', amount,
    'percent', CASE WHEN v_period_visits > 0 THEN round(amount * 100.0 / v_period_visits)::integer ELSE 0 END)
    ORDER BY amount DESC), '[]'::jsonb)
  INTO v_devices
  FROM (
    SELECT coalesce(nullif(device_type, ''), 'Unknown') AS name, count(*)::bigint AS amount
    FROM public.website_visits
    WHERE visited_at >= v_period_start
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
    WHERE visited_at >= v_period_start
    GROUP BY 1 ORDER BY amount DESC LIMIT 5
  ) referrer_rows;

  SELECT jsonb_build_object(
    'bookViews', (SELECT count(*) FROM public.website_visits WHERE visited_at >= v_period_start AND event_name IN ('book_opened', 'discovery_book_opened')),
    'readingProgressUpdates', (SELECT count(*) FROM public.reading_room_events WHERE created_at >= v_period_start AND kind = 'chapter_complete'),
    'groupJoins', (SELECT count(*) FROM public.group_members WHERE joined_at >= v_period_start),
    'discussions', (SELECT count(*) FROM public.posts WHERE created_at >= v_period_start) + (SELECT count(*) FROM public.post_comments WHERE created_at >= v_period_start)
  ) INTO v_reading_engagement;

  RETURN jsonb_build_object(
    'timeframe', v_timeframe,
    'totalSignups', v_total_signups,
    'totalMembers', v_total_signups,
    'newSignups24h', v_new_signups,
    'newReaders', v_new_signups,
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
$$;

GRANT EXECUTE ON FUNCTION public.get_community_pulse_stats(text) TO anon, authenticated, service_role;
