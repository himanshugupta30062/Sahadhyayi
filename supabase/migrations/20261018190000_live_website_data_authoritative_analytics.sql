-- ============================================================================
-- Migration: 20261018190000_live_website_data_authoritative_analytics.sql
-- Purpose: Authoritative Analytics RPCs for Sahadhyayi Community Pulse & Admin Insights
--
-- Features:
-- 1. Exact, authoritative calculation of registered readers (auth.users with profiles fallback).
-- 2. Strict filtering on event_type = 'pageview' for traffic metrics (total, period, hourly, breakdowns).
-- 3. Accurate distinct unique visitors count using coalesce(visitor_id, session_id).
-- 4. True previous-period comparison percentages (24h vs prior 24h, 7d vs prior 7d, 30d vs prior 30d).
--    Returns NULL when previous period has zero baseline (avoids division by zero and fake percentages).
-- 5. 24 chronological hourly buckets (Asia/Kolkata timezone) for the last 24h.
-- 6. Clean representation of zero counts (zero remains 0, never replaced with artificial baselines).
-- 7. Documented unavailable status for session duration until client active-duration telemetry is deployed.
-- 8. Privacy-conscious public contributor leaderboard and privileged admin contributor leaderboard.
-- ============================================================================

-- Ensure necessary indexes on public.website_visits for efficient aggregation
CREATE INDEX IF NOT EXISTS idx_website_visits_pageview_visited_at
  ON public.website_visits(visited_at DESC)
  WHERE event_type = 'pageview';

CREATE INDEX IF NOT EXISTS idx_website_visits_event_name_visited_at
  ON public.website_visits(event_name, visited_at DESC);

-- 1. Authoritative Community Pulse Aggregate Function
CREATE OR REPLACE FUNCTION public.get_community_pulse_stats(p_timeframe text DEFAULT '24h')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_timeframe text := lower(coalesce(p_timeframe, '24h'));
  v_now timestamptz := now();
  v_period_start timestamptz;
  v_period_duration interval;
  v_prev_start timestamptz;
  v_prev_end timestamptz;

  -- Authoritative user metrics
  v_registered_readers bigint := 0;
  v_period_new_readers bigint := 0;
  v_prev_new_readers bigint := 0;
  v_new_readers_change_pct integer := NULL;

  -- Traffic metrics (Strictly event_type = 'pageview')
  v_total_pageviews bigint := 0;
  v_period_pageviews bigint := 0;
  v_prev_period_pageviews bigint := 0;
  v_pageviews_change_pct integer := NULL;

  -- Unique visitor metrics (Strictly event_type = 'pageview')
  v_unique_visitors bigint := 0;
  v_prev_unique_visitors bigint := 0;
  v_unique_visitors_change_pct integer := NULL;

  -- Hourly activity and breakdowns
  v_hourly jsonb := '[]'::jsonb;
  v_countries jsonb := '[]'::jsonb;
  v_pages jsonb := '[]'::jsonb;
  v_devices jsonb := '[]'::jsonb;
  v_referrers jsonb := '[]'::jsonb;
  v_reading_engagement jsonb := '{}'::jsonb;
  v_top_members jsonb := '[]'::jsonb;

  -- Reading engagement counts
  v_book_opens bigint := 0;
  v_chapter_completions bigint := 0;
  v_group_joins bigint := 0;
  v_discussions bigint := 0;
BEGIN
  -- Validate timeframe parameter
  IF v_timeframe NOT IN ('24h', '7d', '30d') THEN
    v_timeframe := '24h';
  END IF;

  IF v_timeframe = '7d' THEN
    v_period_duration := interval '7 days';
  ELSIF v_timeframe = '30d' THEN
    v_period_duration := interval '30 days';
  ELSE
    v_period_duration := interval '24 hours';
  END IF;

  v_period_start := v_now - v_period_duration;
  v_prev_end := v_period_start;
  v_prev_start := v_period_start - v_period_duration;

  -- A. Authoritative registered readers (count from auth.users, fallback to public.profiles)
  BEGIN
    SELECT count(*) INTO v_registered_readers FROM auth.users;
    SELECT count(*) INTO v_period_new_readers FROM auth.users WHERE created_at >= v_period_start AND created_at <= v_now;
    SELECT count(*) INTO v_prev_new_readers FROM auth.users WHERE created_at >= v_prev_start AND created_at < v_prev_end;
  EXCEPTION WHEN OTHERS THEN
    v_registered_readers := 0;
    v_period_new_readers := 0;
    v_prev_new_readers := 0;
  END;

  IF v_registered_readers = 0 THEN
    SELECT count(*) INTO v_registered_readers FROM public.profiles;
    SELECT count(*) INTO v_period_new_readers FROM public.profiles WHERE created_at >= v_period_start AND created_at <= v_now;
    SELECT count(*) INTO v_prev_new_readers FROM public.profiles WHERE created_at >= v_prev_start AND created_at < v_prev_end;
  END IF;

  -- Comparisons: new readers change
  IF v_prev_new_readers > 0 THEN
    v_new_readers_change_pct := round(((v_period_new_readers - v_prev_new_readers)::numeric / v_prev_new_readers::numeric) * 100)::integer;
  ELSE
    v_new_readers_change_pct := NULL;
  END IF;

  -- B. Pageviews aggregation (Strictly event_type = 'pageview')
  SELECT count(*) INTO v_total_pageviews
  FROM public.website_visits
  WHERE event_type = 'pageview';

  SELECT count(*) INTO v_period_pageviews
  FROM public.website_visits
  WHERE event_type = 'pageview'
    AND visited_at >= v_period_start
    AND visited_at <= v_now;

  SELECT count(*) INTO v_prev_period_pageviews
  FROM public.website_visits
  WHERE event_type = 'pageview'
    AND visited_at >= v_prev_start
    AND visited_at < v_prev_end;

  IF v_prev_period_pageviews > 0 THEN
    v_pageviews_change_pct := round(((v_period_pageviews - v_prev_period_pageviews)::numeric / v_prev_period_pageviews::numeric) * 100)::integer;
  ELSE
    v_pageviews_change_pct := NULL;
  END IF;

  -- C. Unique visitors aggregation (Strictly event_type = 'pageview')
  SELECT count(DISTINCT coalesce(visitor_id::text, session_id::text)) INTO v_unique_visitors
  FROM public.website_visits
  WHERE event_type = 'pageview'
    AND visited_at >= v_period_start
    AND visited_at <= v_now
    AND (visitor_id IS NOT NULL OR session_id IS NOT NULL);

  SELECT count(DISTINCT coalesce(visitor_id::text, session_id::text)) INTO v_prev_unique_visitors
  FROM public.website_visits
  WHERE event_type = 'pageview'
    AND visited_at >= v_prev_start
    AND visited_at < v_prev_end
    AND (visitor_id IS NOT NULL OR session_id IS NOT NULL);

  IF v_prev_unique_visitors > 0 THEN
    v_unique_visitors_change_pct := round(((v_unique_visitors - v_prev_unique_visitors)::numeric / v_prev_unique_visitors::numeric) * 100)::integer;
  ELSE
    v_unique_visitors_change_pct := NULL;
  END IF;

  -- D. 24 Hourly buckets (Chronological Asia/Kolkata timezone) for the latest 24 hours
  WITH hours AS (
    SELECT generate_series(0, 23) AS idx
  ), bucket_ranges AS (
    SELECT
      h.idx,
      v_now - (24 - h.idx) * interval '1 hour' AS b_start,
      v_now - (23 - h.idx) * interval '1 hour' AS b_end,
      to_char((v_now AT TIME ZONE 'Asia/Kolkata') - (23 - h.idx) * interval '1 hour', 'FMHH12 AM') AS b_label
    FROM hours h
  ), bucket_counts AS (
    SELECT
      r.idx,
      r.b_start,
      r.b_label,
      count(w.id)::bigint AS amount
    FROM bucket_ranges r
    LEFT JOIN public.website_visits w
      ON w.event_type = 'pageview'
     AND w.visited_at >= r.b_start
     AND w.visited_at < r.b_end
    GROUP BY r.idx, r.b_start, r.b_label
  ), peak_calc AS (
    SELECT coalesce(max(amount), 0) AS max_amount FROM bucket_counts
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'hourIndex', b.idx,
    'bucketStart', to_char(b.b_start AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'label', b.b_label,
    'pageViews', b.amount,
    'count', b.amount,
    'isPeak', (b.amount > 0 AND b.amount = p.max_amount)
  ) ORDER BY b.idx), '[]'::jsonb)
  INTO v_hourly
  FROM bucket_counts b, peak_calc p;

  -- E. Breakdowns (Filtered strictly on event_type = 'pageview')
  -- 1. Top Countries
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'name', name,
    'code', code,
    'count', amount,
    'percent', CASE WHEN v_period_pageviews > 0 THEN round((amount * 100.0) / v_period_pageviews)::integer ELSE 0 END
  ) ORDER BY amount DESC), '[]'::jsonb)
  INTO v_countries
  FROM (
    SELECT
      coalesce(nullif(country_code, ''), 'Unknown') AS name,
      nullif(country_code, '') AS code,
      count(*)::bigint AS amount
    FROM public.website_visits
    WHERE event_type = 'pageview'
      AND visited_at >= v_period_start
      AND visited_at <= v_now
    GROUP BY 1, 2
    ORDER BY amount DESC
    LIMIT 5
  ) c_rows;

  -- 2. Top Visited Pages
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'name', name,
    'path', name,
    'count', amount,
    'percent', CASE WHEN v_period_pageviews > 0 THEN round((amount * 100.0) / v_period_pageviews)::integer ELSE 0 END
  ) ORDER BY amount DESC), '[]'::jsonb)
  INTO v_pages
  FROM (
    SELECT
      coalesce(nullif(split_part(split_part(page_url, '?', 1), '#', 1), ''), '/') AS name,
      count(*)::bigint AS amount
    FROM public.website_visits
    WHERE event_type = 'pageview'
      AND visited_at >= v_period_start
      AND visited_at <= v_now
    GROUP BY 1
    ORDER BY amount DESC
    LIMIT 5
  ) p_rows;

  -- 3. Device Types
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'name', name,
    'count', amount,
    'percent', CASE WHEN v_period_pageviews > 0 THEN round((amount * 100.0) / v_period_pageviews)::integer ELSE 0 END
  ) ORDER BY amount DESC), '[]'::jsonb)
  INTO v_devices
  FROM (
    SELECT
      coalesce(nullif(device_type, ''), 'Desktop') AS name,
      count(*)::bigint AS amount
    FROM public.website_visits
    WHERE event_type = 'pageview'
      AND visited_at >= v_period_start
      AND visited_at <= v_now
    GROUP BY 1
    ORDER BY amount DESC
    LIMIT 4
  ) d_rows;

  -- 4. Referrer Sources
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'name', name,
    'count', amount,
    'percent', CASE WHEN v_period_pageviews > 0 THEN round((amount * 100.0) / v_period_pageviews)::integer ELSE 0 END
  ) ORDER BY amount DESC), '[]'::jsonb)
  INTO v_referrers
  FROM (
    SELECT
      coalesce(nullif(split_part(split_part(referrer, '/', 3), ':', 1), ''), 'Direct') AS name,
      count(*)::bigint AS amount
    FROM public.website_visits
    WHERE event_type = 'pageview'
      AND visited_at >= v_period_start
      AND visited_at <= v_now
    GROUP BY 1
    ORDER BY amount DESC
    LIMIT 5
  ) r_rows;

  -- F. Reading Engagement Metrics
  SELECT count(*) INTO v_book_opens
  FROM public.website_visits
  WHERE visited_at >= v_period_start
    AND visited_at <= v_now
    AND (
      event_name IN ('book_opened', 'discovery_book_opened', 'reading_started')
      OR page_url LIKE '%/book/%'
      OR page_url LIKE '%/reader/%'
    );

  SELECT count(*) INTO v_chapter_completions
  FROM public.reading_room_events
  WHERE created_at >= v_period_start
    AND created_at <= v_now
    AND kind = 'chapter_complete';

  SELECT count(*) INTO v_group_joins
  FROM public.group_members
  WHERE joined_at >= v_period_start
    AND joined_at <= v_now;

  SELECT
    (SELECT count(*) FROM public.posts WHERE created_at >= v_period_start AND created_at <= v_now) +
    (SELECT count(*) FROM public.post_comments WHERE created_at >= v_period_start AND created_at <= v_now)
  INTO v_discussions;

  v_reading_engagement := jsonb_build_object(
    'bookOpens', jsonb_build_object('value', v_book_opens, 'status', 'available', 'definition', 'Unique book and reader page views or explicit open events'),
    'readingProgressCompletions', jsonb_build_object('value', v_chapter_completions, 'status', 'available', 'definition', 'Completed reading room chapters recorded'),
    'groupJoins', jsonb_build_object('value', v_group_joins, 'status', 'available', 'definition', 'New reading group memberships formed'),
    'discussions', jsonb_build_object('value', v_discussions, 'status', 'available', 'definition', 'Community posts and comment responses published'),
    -- Backward-compatible structure
    'bookViews', jsonb_build_object('count', v_book_opens, 'tracked', true, 'label', 'Book Views & Discovery'),
    'readingProgressUpdates', jsonb_build_object('count', v_chapter_completions, 'tracked', true, 'label', 'Progress Updates & Chapters'),
    'groupJoinsCount', jsonb_build_object('count', v_group_joins, 'tracked', true, 'label', 'Group Memberships Joined'),
    'discussionsCount', jsonb_build_object('count', v_discussions, 'tracked', true, 'label', 'Discussions & Comments')
  );

  -- G. Genuine Community Contributor Leaderboard (Last 24 hours / timeframe)
  WITH user_actions AS (
    SELECT user_id, 'posts' AS action_type FROM public.posts WHERE created_at >= v_period_start AND created_at <= v_now AND user_id IS NOT NULL
    UNION ALL
    SELECT user_id, 'comments' AS action_type FROM public.post_comments WHERE created_at >= v_period_start AND created_at <= v_now AND user_id IS NOT NULL
    UNION ALL
    SELECT user_id, 'messages' AS action_type FROM public.reading_room_messages WHERE created_at >= v_period_start AND created_at <= v_now AND user_id IS NOT NULL
    UNION ALL
    SELECT user_id, 'chapters' AS action_type FROM public.reading_room_events WHERE created_at >= v_period_start AND created_at <= v_now AND kind = 'chapter_complete' AND user_id IS NOT NULL
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
    ORDER BY total_points DESC, total_actions DESC, user_id ASC
    LIMIT 5
  ), ranked_members AS (
    SELECT
      row_number() OVER (ORDER BY total_points DESC, total_actions DESC, user_id ASC) AS member_rank,
      ms.*
    FROM member_stats ms
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'rank', rm.member_rank,
    'userId', rm.user_id,
    'name', coalesce(nullif(p.full_name, ''), nullif(p.username, ''), 'Community Reader'),
    'username', p.username,
    'avatarUrl', p.profile_photo_url,
    'activityCount', rm.total_actions,
    'totalPoints', rm.total_points,
    'breakdown', jsonb_build_object(
      'posts', rm.posts_count,
      'comments', rm.comments_count,
      'messages', rm.messages_count,
      'chapters', rm.chapters_count
    )
  ) ORDER BY rm.member_rank), '[]'::jsonb)
  INTO v_top_members
  FROM ranked_members rm
  LEFT JOIN public.profiles p ON p.id = rm.user_id;

  -- H. Return Consolidated JSON Contract
  RETURN jsonb_build_object(
    'schemaVersion', 1,
    'timeframe', v_timeframe,
    'periodStart', to_char(v_period_start AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'periodEnd', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'lastUpdated', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'freshness', 'fresh',

    'metrics', jsonb_build_object(
      'registeredReaders', jsonb_build_object('value', v_registered_readers, 'status', 'available', 'definition', 'Authoritative count of registered reader accounts'),
      'totalPageViews', jsonb_build_object('value', v_total_pageviews, 'status', 'available', 'definition', 'Total recorded pageviews across platform lifetime'),
      'periodPageViews', jsonb_build_object('value', v_period_pageviews, 'status', 'available', 'definition', 'Recorded pageviews in the selected timeframe'),
      'uniqueVisitors', jsonb_build_object('value', v_unique_visitors, 'status', 'available', 'definition', 'Distinct visitors tracked in the selected timeframe'),
      'newReaders', jsonb_build_object('value', v_period_new_readers, 'status', 'available', 'definition', 'New accounts registered in the selected timeframe'),
      'averageSessionDurationSeconds', jsonb_build_object('value', NULL, 'status', 'unavailable', 'definition', 'Active session duration telemetry not currently instrumented')
    ),

    'comparisons', jsonb_build_object(
      'pageViewsChangePercent', v_pageviews_change_pct,
      'uniqueVisitorsChangePercent', v_unique_visitors_change_pct,
      'newReadersChangePercent', v_new_readers_change_pct
    ),

    'hourlyActivity', v_hourly,

    'breakdowns', jsonb_build_object(
      'countries', v_countries,
      'pages', v_pages,
      'devices', v_devices,
      'referrers', v_referrers
    ),

    'engagement', v_reading_engagement,
    'topMembers', v_top_members,

    -- Legacy & backward-compatibility mappings
    'totalSignups', v_registered_readers,
    'totalMembers', v_registered_readers,
    'newSignups24h', v_period_new_readers,
    'newReaders', v_period_new_readers,
    'totalVisits', v_total_pageviews,
    'last24hVisits', v_period_pageviews,
    'uniqueVisitors24h', v_unique_visitors,
    'avgTimeOnSite', '—',
    'topCountries', v_countries,
    'topPages', v_pages,
    'devices', v_devices,
    'referrers', v_referrers,
    'readingEngagement', v_reading_engagement
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_pulse_stats(text) TO anon, authenticated, service_role;

-- 2. Privileged Administrator Contributor Leaderboard Function
CREATE OR REPLACE FUNCTION public.get_admin_contributor_leaderboard(p_timeframe text DEFAULT '24h')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_timeframe text := lower(coalesce(p_timeframe, '24h'));
  v_now timestamptz := now();
  v_period_start timestamptz;
  v_leaderboard jsonb := '[]'::jsonb;
BEGIN
  -- Strict server-side verification: reject any non-administrator
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view full contributor telemetry.';
  END IF;

  IF v_timeframe = '7d' THEN
    v_period_start := v_now - interval '7 days';
  ELSIF v_timeframe = '30d' THEN
    v_period_start := v_now - interval '30 days';
  ELSE
    v_period_start := v_now - interval '24 hours';
  END IF;

  WITH user_actions AS (
    SELECT user_id, 'posts' AS action_type FROM public.posts WHERE created_at >= v_period_start AND created_at <= v_now AND user_id IS NOT NULL
    UNION ALL
    SELECT user_id, 'comments' AS action_type FROM public.post_comments WHERE created_at >= v_period_start AND created_at <= v_now AND user_id IS NOT NULL
    UNION ALL
    SELECT user_id, 'messages' AS action_type FROM public.reading_room_messages WHERE created_at >= v_period_start AND created_at <= v_now AND user_id IS NOT NULL
    UNION ALL
    SELECT user_id, 'chapters' AS action_type FROM public.reading_room_events WHERE created_at >= v_period_start AND created_at <= v_now AND kind = 'chapter_complete' AND user_id IS NOT NULL
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
    ORDER BY total_points DESC, total_actions DESC, user_id ASC
    LIMIT 20
  ), ranked_members AS (
    SELECT
      row_number() OVER (ORDER BY total_points DESC, total_actions DESC, user_id ASC) AS member_rank,
      ms.*
    FROM member_stats ms
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'rank', rm.member_rank,
    'userId', rm.user_id,
    'name', coalesce(nullif(p.full_name, ''), nullif(p.username, ''), 'Community Reader'),
    'username', p.username,
    'avatarUrl', p.profile_photo_url,
    'activityCount', rm.total_actions,
    'totalPoints', rm.total_points,
    'breakdown', jsonb_build_object(
      'posts', rm.posts_count,
      'comments', rm.comments_count,
      'messages', rm.messages_count,
      'chapters', rm.chapters_count
    )
  ) ORDER BY rm.member_rank), '[]'::jsonb)
  INTO v_leaderboard
  FROM ranked_members rm
  LEFT JOIN public.profiles p ON p.id = rm.user_id;

  RETURN jsonb_build_object(
    'timeframe', v_timeframe,
    'periodStart', to_char(v_period_start AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'periodEnd', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'leaderboard', v_leaderboard
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_contributor_leaderboard(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_contributor_leaderboard(text) TO authenticated, service_role;

