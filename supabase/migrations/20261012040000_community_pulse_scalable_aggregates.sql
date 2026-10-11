-- Migration: Scalable, accurate PostgreSQL aggregation for Sahadhyayi Community Pulse
-- Replaces client/edge in-memory looping of 10,000 visit rows with efficient SQL aggregates.

CREATE OR REPLACE FUNCTION public.get_community_pulse_stats(p_timeframe text DEFAULT '24h')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_timeframe text := lower(coalesce(p_timeframe, '24h'));
  v_hours integer;
  v_period_start timestamptz;
  v_24h_start timestamptz;
  v_now timestamptz := now();
  
  v_total_signups bigint := 0;
  v_new_signups_period bigint := 0;
  v_total_visits bigint := 0;
  v_visits_period bigint := 0;
  v_unique_visitors_period bigint := null;
  
  v_hourly_activity jsonb := '[]'::jsonb;
  v_peak_hour jsonb := null;
  v_top_countries jsonb := '[]'::jsonb;
  v_top_cities jsonb := '[]'::jsonb;
  v_most_visited_city_24h jsonb := null;
  v_top_members jsonb := '[]'::jsonb;
  v_reading_engagement jsonb := '{}'::jsonb;
  
  v_book_views bigint := 0;
  v_progress_updates bigint := 0;
  v_group_joins bigint := 0;
  v_discussions bigint := 0;
  v_max_hourly_count bigint := 0;
BEGIN
  -- 1. Validate timeframe parameter
  IF v_timeframe NOT IN ('24h', '7d', '30d') THEN
    v_timeframe := '24h';
  END IF;

  IF v_timeframe = '7d' THEN
    v_hours := 7 * 24;
  ELSIF v_timeframe = '30d' THEN
    v_hours := 30 * 24;
  ELSE
    v_hours := 24;
  END IF;

  v_period_start := v_now - make_interval(hours => v_hours);
  v_24h_start := v_now - interval '24 hours';

  -- 2. Member counts from profiles (exact count, never capped at 1000)
  SELECT count(*) INTO v_total_signups FROM public.profiles;
  SELECT count(*) INTO v_new_signups_period FROM public.profiles WHERE created_at >= v_period_start;

  -- 3. Visit totals from website_visits
  SELECT count(*) INTO v_total_visits FROM public.website_visits;
  SELECT count(*) INTO v_visits_period FROM public.website_visits WHERE visited_at >= v_period_start;

  -- 4. Unique visitors: count distinct visitor_id or session_id
  SELECT count(DISTINCT coalesce(visitor_id::text, session_id::text))
  INTO v_unique_visitors_period
  FROM public.website_visits
  WHERE visited_at >= v_period_start
    AND (visitor_id IS NOT NULL OR session_id IS NOT NULL);

  -- 5. 24 chronological hourly buckets (Asia/Kolkata timezone) for the last 24h
  WITH hour_series AS (
    SELECT
      h AS hour_index,
      to_char((v_now AT TIME ZONE 'Asia/Kolkata') - (23 - h) * interval '1 hour', 'FMHH12 AM') AS hour_label,
      v_now - (24 - h) * interval '1 hour' AS bucket_start,
      v_now - (23 - h) * interval '1 hour' AS bucket_end
    FROM generate_series(0, 23) AS h
  ), bucket_counts AS (
    SELECT
      s.hour_index,
      s.hour_label,
      count(w.id)::bigint AS visit_count
    FROM hour_series s
    LEFT JOIN public.website_visits w
      ON w.visited_at >= s.bucket_start
     AND w.visited_at < s.bucket_end
    GROUP BY s.hour_index, s.hour_label
    ORDER BY s.hour_index ASC
  ), peak_calc AS (
    SELECT coalesce(max(visit_count), 0) AS max_count FROM bucket_counts
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'hourIndex', b.hour_index,
        'label', b.hour_label,
        'count', b.visit_count,
        'isPeak', (b.visit_count > 0 AND b.visit_count = p.max_count)
      )
      ORDER BY b.hour_index ASC
    ),
    (SELECT max_count FROM peak_calc)
  INTO v_hourly_activity, v_max_hourly_count
  FROM bucket_counts b, peak_calc p;

  IF v_hourly_activity IS NULL THEN
    v_hourly_activity := '[]'::jsonb;
  END IF;

  IF v_max_hourly_count > 0 THEN
    SELECT elem INTO v_peak_hour
    FROM jsonb_array_elements(v_hourly_activity) elem
    WHERE (elem->>'isPeak')::boolean = true
    LIMIT 1;
  ELSE
    v_peak_hour := null;
  END IF;

  -- 6. Top Countries in the selected period (sorted by visits DESC, limit 10)
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'code', country_code,
        'count', visit_count
      )
      ORDER BY visit_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_top_countries
  FROM (
    SELECT
      country_code,
      count(*)::bigint AS visit_count
    FROM public.website_visits
    WHERE visited_at >= v_period_start
      AND country_code IS NOT NULL
      AND country_code <> ''
      AND country_code <> 'XX'
    GROUP BY country_code
    ORDER BY visit_count DESC
    LIMIT 10
  ) country_sub;

  -- 7. Top Cities in the selected period (sorted by visits DESC, limit 10)
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', city_label,
        'count', visit_count
      )
      ORDER BY visit_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_top_cities
  FROM (
    SELECT
      CASE
        WHEN region IS NOT NULL AND region <> '' AND region <> 'Unknown' THEN city || ', ' || region
        ELSE city
      END AS city_label,
      count(*)::bigint AS visit_count
    FROM public.website_visits
    WHERE visited_at >= v_period_start
      AND city IS NOT NULL
      AND city <> ''
      AND city <> 'Unknown'
    GROUP BY 1
    ORDER BY visit_count DESC
    LIMIT 10
  ) city_sub;

  -- 8. Most visited city strictly in the last 24h
  SELECT jsonb_build_object(
    'name', city_label,
    'count', visit_count
  )
  INTO v_most_visited_city_24h
  FROM (
    SELECT
      CASE
        WHEN region IS NOT NULL AND region <> '' AND region <> 'Unknown' THEN city || ', ' || region
        ELSE city
      END AS city_label,
      count(*)::bigint AS visit_count
    FROM public.website_visits
    WHERE visited_at >= v_24h_start
      AND city IS NOT NULL
      AND city <> ''
      AND city <> 'Unknown'
    GROUP BY 1
    ORDER BY visit_count DESC
    LIMIT 1
  ) c24_sub;

  -- 9. Top 5 active community members strictly in the selected period
  -- Legitimate timestamped events across posts, comments, messages, chapter completions
  WITH user_actions AS (
    SELECT user_id, 'posts' AS action_type FROM public.posts WHERE created_at >= v_period_start AND user_id IS NOT NULL
    UNION ALL
    SELECT user_id, 'comments' AS action_type FROM public.post_comments WHERE created_at >= v_period_start AND user_id IS NOT NULL
    UNION ALL
    SELECT user_id, 'messages' AS action_type FROM public.reading_room_messages WHERE created_at >= v_period_start AND user_id IS NOT NULL
    UNION ALL
    SELECT user_id, 'chapters' AS action_type FROM public.reading_room_events WHERE created_at >= v_period_start AND kind = 'chapter_complete' AND user_id IS NOT NULL
  ), member_stats AS (
    SELECT
      user_id,
      count(*)::bigint AS total_actions,
      count(*) FILTER (WHERE action_type = 'posts')::bigint AS posts_count,
      count(*) FILTER (WHERE action_type = 'comments')::bigint AS comments_count,
      count(*) FILTER (WHERE action_type = 'messages')::bigint AS messages_count,
      count(*) FILTER (WHERE action_type = 'chapters')::bigint AS chapters_count,
      (
        count(*) FILTER (WHERE action_type = 'posts') * 5 +
        count(*) FILTER (WHERE action_type = 'comments') * 3 +
        count(*) FILTER (WHERE action_type = 'messages') * 2 +
        count(*) FILTER (WHERE action_type = 'chapters') * 4
      )::bigint AS total_points
    FROM user_actions
    GROUP BY user_id
    ORDER BY total_points DESC, total_actions DESC
    LIMIT 5
  )
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'rank', row_number() OVER (ORDER BY m.total_points DESC, m.total_actions DESC),
        'userId', m.user_id,
        'name', coalesce(p.full_name, p.username, 'Community Member'),
        'username', p.username,
        'avatarUrl', p.profile_photo_url,
        'activityCount', m.total_actions,
        'totalPoints', m.total_points,
        'breakdown', jsonb_build_object(
          'posts', m.posts_count,
          'comments', m.comments_count,
          'messages', m.messages_count,
          'chapters', m.chapters_count
        )
      )
    ),
    '[]'::jsonb
  )
  INTO v_top_members
  FROM member_stats m
  LEFT JOIN public.profiles p ON p.id = m.user_id;

  -- 10. Reading engagement metrics
  -- bookViews: event_name IN ('book_opened', 'discovery_book_opened') OR page_url LIKE '%/book/%' OR page_url LIKE '%/reader/%'
  SELECT count(*)::bigint INTO v_book_views
  FROM public.website_visits
  WHERE visited_at >= v_period_start
    AND (
      event_name IN ('book_opened', 'discovery_book_opened')
      OR page_url LIKE '%/book/%'
      OR page_url LIKE '%/reader/%'
    );

  -- readingProgressUpdates: actual chapter completion events
  SELECT count(*)::bigint INTO v_progress_updates
  FROM public.reading_room_events
  WHERE created_at >= v_period_start
    AND kind = 'chapter_complete';

  -- groupJoins: actual memberships created in group_members table
  SELECT count(*)::bigint INTO v_group_joins
  FROM public.group_members
  WHERE joined_at >= v_period_start;

  -- discussions: posts created + comments created in period
  SELECT
    (SELECT count(*)::bigint FROM public.posts WHERE created_at >= v_period_start) +
    (SELECT count(*)::bigint FROM public.post_comments WHERE created_at >= v_period_start)
  INTO v_discussions;

  v_reading_engagement := jsonb_build_object(
    'bookViews', jsonb_build_object(
      'count', v_book_views,
      'tracked', true,
      'label', 'Book Views & Discovery'
    ),
    'readingProgressUpdates', jsonb_build_object(
      'count', v_progress_updates,
      'tracked', true,
      'label', 'Progress Updates & Chapters'
    ),
    'groupJoins', jsonb_build_object(
      'count', v_group_joins,
      'tracked', true,
      'label', 'Group Memberships Joined'
    ),
    'discussions', jsonb_build_object(
      'count', v_discussions,
      'tracked', true,
      'label', 'Discussions & Comments'
    )
  );

  -- 11. Build and return the consolidated response matching the frontend contract
  RETURN jsonb_build_object(
    'timeframe', v_timeframe,
    'totalSignups', v_total_signups,
    'newSignups24h', v_new_signups_period,
    'totalVisits', v_total_visits,
    'last24hVisits', v_visits_period,
    'uniqueVisitors24h', v_unique_visitors_period,
    'hourlyActivity', v_hourly_activity,
    'peakHour', v_peak_hour,
    'topCountries', v_top_countries,
    'topCities', v_top_cities,
    'mostVisitedCity24h', v_most_visited_city_24h,
    'topMembers', v_top_members,
    'readingEngagement', v_reading_engagement,
    'lastUpdated', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
END;
$$;

-- Security: Grant execute only to service_role to ensure public callers must route
-- through sanitized APIs (the Edge Function or validated endpoints) without direct DB misuse.
REVOKE ALL ON FUNCTION public.get_community_pulse_stats(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_pulse_stats(text) TO service_role;
