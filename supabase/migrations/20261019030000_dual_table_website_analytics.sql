-- ============================================================================
-- Migration: 20261019030000_dual_table_website_analytics.sql
-- Purpose: Dual-Table Website Analytics & Rolling 30-Day Telemetry System
--
-- Architecture:
-- 1. PRESERVE public.website_visits:
--    Historical records, lifetime counters, and admin audit logs remain intact.
-- 2. CREATE public.website_visit_events:
--    Rolling 30-day privacy-conscious visitor events table for accurate recent activity.
--    No raw IP addresses, no emails, no auth tokens, no browser fingerprints.
-- 3. AUTOMATIC 30-DAY RETENTION:
--    Daily scheduled cleanup deleting events where created_at < now() - interval '30 days'.
--    Legacy website_visits is strictly untouched.
-- 4. AUTHORITATIVE DUAL-TABLE AGGREGATION:
--    Retrieves lifetime all-time visits from website_visits while computing
--    24h, 7d, 30d, daily trends, hourly buckets, and top paths from website_visit_events.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create the rolling 30-day website_visit_events table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.website_visit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT,
  visitor_id TEXT,
  page_path TEXT NOT NULL,
  referrer TEXT,
  event_type TEXT NOT NULL DEFAULT 'pageview',
  event_name TEXT,
  device_type TEXT DEFAULT 'Desktop',
  country_code TEXT
);

-- Sensible indexes for fast analytics queries & rolling 30-day retention cleanup
CREATE INDEX IF NOT EXISTS idx_website_visit_events_created_at
  ON public.website_visit_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_visit_events_session_created
  ON public.website_visit_events(session_id, created_at DESC)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_website_visit_events_page_path
  ON public.website_visit_events(page_path, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_visit_events_event_type
  ON public.website_visit_events(event_type, created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. Security Controls & Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE public.website_visit_events ENABLE ROW LEVEL SECURITY;

-- Deny raw record access from public, anonymous, and standard authenticated users
REVOKE ALL ON TABLE public.website_visit_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.website_visit_events TO service_role;

-- Allow verified administrators to view events if needed for security auditing
CREATE POLICY "Admins can view visit events"
  ON public.website_visit_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Automatic 30-Day Retention Cleanup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_website_visit_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted integer;
BEGIN
  -- Strictly deletes ONLY from rolling website_visit_events
  -- Legacy website_visits table is NEVER touched
  DELETE FROM public.website_visit_events
  WHERE created_at < now() - interval '30 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Schedule daily cron via pg_cron (if extension is available in PostgreSQL environment)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      -- Unschedule prior job if present to maintain idempotency
      PERFORM cron.unschedule('cleanup-website-visit-events')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-website-visit-events');

      -- Run daily at 03:00 UTC
      PERFORM cron.schedule(
        'cleanup-website-visit-events',
        '0 3 * * *',
        'SELECT public.cleanup_old_website_visit_events();'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Handle environments without cron permissions safely
      NULL;
    END;
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Authoritative Dual-Table Website Analytics RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dual_table_website_analytics(p_timeframe text DEFAULT '24h')
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

  -- Lifetime metrics from original website_visits table
  v_lifetime_visits bigint := 0;

  -- Rolling 30-day event telemetry metrics
  v_rolling_total_events bigint := 0;
  v_rolling_total_rows bigint := 0;
  v_rolling_24h_views bigint := 0;
  v_rolling_7d_views bigint := 0;
  v_rolling_30d_views bigint := 0;
  v_period_views bigint := 0;
  v_prev_period_views bigint := 0;
  v_views_change_pct integer := NULL;

  -- Unique visitors (pseudonymous session / visitor identifiers)
  v_unique_visitors_24h bigint := 0;
  v_unique_visitors_7d bigint := 0;
  v_unique_visitors_30d bigint := 0;
  v_period_unique bigint := 0;
  v_prev_period_unique bigint := 0;
  v_unique_change_pct integer := NULL;

  -- Community membership
  v_registered_readers bigint := 0;
  v_new_readers_period bigint := 0;
  v_prev_new_readers bigint := 0;
  v_new_readers_change_pct integer := NULL;

  -- Visual trend collections
  v_hourly jsonb := '[]'::jsonb;
  v_daily jsonb := '[]'::jsonb;
  v_top_pages jsonb := '[]'::jsonb;
  v_referrers jsonb := '[]'::jsonb;
  v_devices jsonb := '[]'::jsonb;
  v_countries jsonb := '[]'::jsonb;

  -- Rollout metadata
  v_collection_start_date timestamptz := '2026-10-19 00:00:00+00'::timestamptz;
  v_is_initial_rollout boolean := false;
BEGIN
  -- Validate timeframe
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

  -- A. Lifetime visits from original website_visits table
  SELECT count(*) INTO v_lifetime_visits FROM public.website_visits;

  -- B. Check rolling table pageview count. Non-pageview telemetry must not make us switch away from legacy bridge.
  SELECT count(*) INTO v_rolling_total_rows FROM public.website_visit_events;
  SELECT count(*) INTO v_rolling_total_events FROM public.website_visit_events WHERE event_type = 'pageview';

  IF v_rolling_total_rows = 0 THEN
    v_is_initial_rollout := true;
  END IF;

  -- C. Rolling period calculations from website_visit_events
  -- If rolling table has accumulated events, calculate from website_visit_events.
  -- Otherwise, if initial rollout, provide fallback from website_visits where event_type = 'pageview'
  -- so the UI transitions smoothly without breaking.
  IF v_rolling_total_rows > 0 THEN
    -- 24h, 7d, 30d views from website_visit_events
    SELECT count(*) INTO v_rolling_24h_views
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_now - interval '24 hours';

    SELECT count(*) INTO v_rolling_7d_views
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_now - interval '7 days';

    SELECT count(*) INTO v_rolling_30d_views
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_now - interval '30 days';

    SELECT count(*) INTO v_period_views
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now;

    SELECT count(*) INTO v_prev_period_views
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_prev_start AND created_at < v_prev_end;

    -- Distinct visitors from website_visit_events
    SELECT count(DISTINCT coalesce(visitor_id, session_id)) INTO v_unique_visitors_24h
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_now - interval '24 hours'
      AND (visitor_id IS NOT NULL OR session_id IS NOT NULL);

    SELECT count(DISTINCT coalesce(visitor_id, session_id)) INTO v_unique_visitors_7d
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_now - interval '7 days'
      AND (visitor_id IS NOT NULL OR session_id IS NOT NULL);

    SELECT count(DISTINCT coalesce(visitor_id, session_id)) INTO v_unique_visitors_30d
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_now - interval '30 days'
      AND (visitor_id IS NOT NULL OR session_id IS NOT NULL);

    SELECT count(DISTINCT coalesce(visitor_id, session_id)) INTO v_period_unique
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now
      AND (visitor_id IS NOT NULL OR session_id IS NOT NULL);

    SELECT count(DISTINCT coalesce(visitor_id, session_id)) INTO v_prev_period_unique
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_prev_start AND created_at < v_prev_end
      AND (visitor_id IS NOT NULL OR session_id IS NOT NULL);

    -- Top pages from website_visit_events
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_top_pages
    FROM (
      SELECT
        page_path AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_views, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visit_events
      WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now
      GROUP BY page_path
      ORDER BY count(*) DESC
      LIMIT 6
    ) item;

    -- Referrers from website_visit_events
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_referrers
    FROM (
      SELECT
        coalesce(referrer, 'Direct / Internal') AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_views, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visit_events
      WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now
      GROUP BY 1
      ORDER BY count(*) DESC
      LIMIT 5
    ) item;

    -- Devices from website_visit_events
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_devices
    FROM (
      SELECT
        coalesce(device_type, 'Desktop') AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_views, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visit_events
      WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now
      GROUP BY 1
      ORDER BY count(*) DESC
    ) item;

    -- Countries from website_visit_events
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_countries
    FROM (
      SELECT
        country_code AS code,
        country_code AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_views, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visit_events
      WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now
        AND country_code IS NOT NULL
      GROUP BY country_code
      ORDER BY count(*) DESC
      LIMIT 6
    ) item;

    -- Daily activity trend (last 30 days) from website_visit_events
    SELECT coalesce(jsonb_agg(day_item ORDER BY day_item->>'bucketDate' ASC), '[]'::jsonb) INTO v_daily
    FROM (
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', v_now) - interval '29 days',
          date_trunc('day', v_now),
          interval '1 day'
        ) AS day_ts
      )
      SELECT jsonb_build_object(
        'bucketDate', to_char(d.day_ts, 'YYYY-MM-DD'),
        'label', to_char(d.day_ts, 'Mon DD'),
        'count', count(e.id)::integer,
        'pageViews', count(e.id)::integer,
        'uniqueVisitors', count(DISTINCT coalesce(e.visitor_id, e.session_id))::integer
      ) AS day_item
      FROM days d
      LEFT JOIN public.website_visit_events e
        ON e.event_type = 'pageview'
       AND date_trunc('day', e.created_at) = d.day_ts
      GROUP BY d.day_ts
    ) sub;

  ELSE
    -- Initial rollout: legacy website_visits bridge
    SELECT count(*) INTO v_rolling_24h_views
    FROM public.website_visits
    WHERE event_type = 'pageview' AND visited_at >= v_now - interval '24 hours';

    SELECT count(*) INTO v_rolling_7d_views
    FROM public.website_visits
    WHERE event_type = 'pageview' AND visited_at >= v_now - interval '7 days';

    SELECT count(*) INTO v_rolling_30d_views
    FROM public.website_visits
    WHERE event_type = 'pageview' AND visited_at >= v_now - interval '30 days';

    SELECT count(*) INTO v_period_views
    FROM public.website_visits
    WHERE event_type = 'pageview' AND visited_at >= v_period_start AND visited_at <= v_now;

    SELECT count(*) INTO v_prev_period_views
    FROM public.website_visits
    WHERE event_type = 'pageview' AND visited_at >= v_prev_start AND visited_at < v_prev_end;

    SELECT count(DISTINCT coalesce(visitor_id::text, session_id::text)) INTO v_unique_visitors_24h
    FROM public.website_visits
    WHERE event_type = 'pageview' AND visited_at >= v_now - interval '24 hours';

    SELECT count(DISTINCT coalesce(visitor_id::text, session_id::text)) INTO v_unique_visitors_7d
    FROM public.website_visits
    WHERE event_type = 'pageview' AND visited_at >= v_now - interval '7 days';

    SELECT count(DISTINCT coalesce(visitor_id::text, session_id::text)) INTO v_unique_visitors_30d
    FROM public.website_visits
    WHERE event_type = 'pageview' AND visited_at >= v_now - interval '30 days';

    v_period_unique := CASE
      WHEN v_timeframe = '7d' THEN v_unique_visitors_7d
      WHEN v_timeframe = '30d' THEN v_unique_visitors_30d
      ELSE v_unique_visitors_24h
    END;
  END IF;

  -- Comparisons
  IF v_prev_period_views > 0 THEN
    v_views_change_pct := round(((v_period_views - v_prev_period_views)::numeric / v_prev_period_views::numeric) * 100)::integer;
  END IF;

  IF v_prev_period_unique > 0 THEN
    v_unique_change_pct := round(((v_period_unique - v_prev_period_unique)::numeric / v_prev_period_unique::numeric) * 100)::integer;
  END IF;

  -- D. Community Members
  BEGIN
    SELECT count(*) INTO v_registered_readers FROM auth.users;
    SELECT count(*) INTO v_new_readers_period FROM auth.users WHERE created_at >= v_period_start AND created_at <= v_now;
    SELECT count(*) INTO v_prev_new_readers FROM auth.users WHERE created_at >= v_prev_start AND created_at < v_prev_end;
  EXCEPTION WHEN OTHERS THEN
    v_registered_readers := 0;
  END;

  IF v_registered_readers = 0 THEN
    SELECT count(*) INTO v_registered_readers FROM public.profiles;
    SELECT count(*) INTO v_new_readers_period FROM public.profiles WHERE created_at >= v_period_start AND created_at <= v_now;
    SELECT count(*) INTO v_prev_new_readers FROM public.profiles WHERE created_at >= v_prev_start AND created_at < v_prev_end;
  END IF;

  IF v_prev_new_readers > 0 THEN
    v_new_readers_change_pct := round(((v_new_readers_period - v_prev_new_readers)::numeric / v_prev_new_readers::numeric) * 100)::integer;
  END IF;

  -- E. 24 Hourly Buckets (Asia/Kolkata timezone) for the last 24h
  SELECT coalesce(jsonb_agg(hour_item ORDER BY (hour_item->>'hourIndex')::integer ASC), '[]'::jsonb) INTO v_hourly
  FROM (
    WITH hour_series AS (
      SELECT generate_series(
        date_trunc('hour', v_now AT TIME ZONE 'Asia/Kolkata') - interval '23 hours',
        date_trunc('hour', v_now AT TIME ZONE 'Asia/Kolkata'),
        interval '1 hour'
      ) AS bucket_ist,
      generate_subscripts(array_fill(0, ARRAY[24]), 1) - 1 AS h_idx
    )
    SELECT jsonb_build_object(
      'hourIndex', s.h_idx,
      'bucketStart', (s.bucket_ist AT TIME ZONE 'Asia/Kolkata'),
      'label', to_char(s.bucket_ist, 'FMHH12 AM'),
      'pageViews', coalesce(
        CASE WHEN v_rolling_total_events > 0 THEN (
          SELECT count(*)
          FROM public.website_visit_events e
          WHERE e.event_type = 'pageview'
            AND date_trunc('hour', e.created_at AT TIME ZONE 'Asia/Kolkata') = s.bucket_ist
        ) ELSE (
          SELECT count(*)
          FROM public.website_visits w
          WHERE w.event_type = 'pageview'
            AND date_trunc('hour', w.visited_at AT TIME ZONE 'Asia/Kolkata') = s.bucket_ist
        ) END,
        0
      )::integer,
      'count', coalesce(
        CASE WHEN v_rolling_total_events > 0 THEN (
          SELECT count(*)
          FROM public.website_visit_events e
          WHERE e.event_type = 'pageview'
            AND date_trunc('hour', e.created_at AT TIME ZONE 'Asia/Kolkata') = s.bucket_ist
        ) ELSE (
          SELECT count(*)
          FROM public.website_visits w
          WHERE w.event_type = 'pageview'
            AND date_trunc('hour', w.visited_at AT TIME ZONE 'Asia/Kolkata') = s.bucket_ist
        ) END,
        0
      )::integer,
      'isPeak', false
    ) AS hour_item
    FROM hour_series s
  ) h_sub;

  -- Mark peak hour
  IF jsonb_array_length(v_hourly) > 0 THEN
    DECLARE
      v_max_val integer := 0;
      v_elem jsonb;
      v_annotated jsonb := '[]'::jsonb;
    BEGIN
      FOR v_elem IN SELECT * FROM jsonb_array_elements(v_hourly) LOOP
        IF (v_elem->>'count')::integer > v_max_val THEN
          v_max_val := (v_elem->>'count')::integer;
        END IF;
      END LOOP;

      FOR v_elem IN SELECT * FROM jsonb_array_elements(v_hourly) LOOP
        IF v_max_val > 0 AND (v_elem->>'count')::integer = v_max_val THEN
          v_annotated := v_annotated || jsonb_build_object(
            'hourIndex', (v_elem->>'hourIndex')::integer,
            'bucketStart', v_elem->>'bucketStart',
            'label', v_elem->>'label',
            'pageViews', (v_elem->>'pageViews')::integer,
            'count', (v_elem->>'count')::integer,
            'isPeak', true
          );
        ELSE
          v_annotated := v_annotated || v_elem;
        END IF;
      END LOOP;
      v_hourly := v_annotated;
    END;
  END IF;

  -- Return comprehensive dual-table payload
  RETURN jsonb_build_object(
    'timeframe', v_timeframe,
    'lastUpdated', v_now,
    -- Lifetime source (Original website_visits table)
    'lifetime', jsonb_build_object(
      'totalVisits', v_lifetime_visits,
      'sourceTable', 'public.website_visits',
      'label', 'All-Time Visits'
    ),
    -- Rolling 30-Day source (New website_visit_events table)
    'rolling', jsonb_build_object(
      'sourceTable', 'public.website_visit_events',
      'collectionStartedAt', v_collection_start_date,
      'isInitialRollout', v_is_initial_rollout,
      'pageViews24h', v_rolling_24h_views,
      'pageViews7d', v_rolling_7d_views,
      'pageViews30d', v_rolling_30d_views,
      'uniqueVisitors24h', v_unique_visitors_24h,
      'uniqueVisitors7d', v_unique_visitors_7d,
      'uniqueVisitors30d', v_unique_visitors_30d
    ),
    -- Current Period Active Metrics (Backwards compatible with CommunityPulse UI)
    'pageViews', v_period_views,
    'totalVisits', v_lifetime_visits,
    'last24hVisits', v_rolling_24h_views,
    'uniqueVisitors', v_period_unique,
    'uniqueVisitors24h', v_unique_visitors_24h,
    'totalMembers', v_registered_readers,
    'registeredReaders', v_registered_readers,
    'newReaders', v_new_readers_period,
    'newSignups24h', v_new_readers_period,
    'hourlyActivity', v_hourly,
    'dailyActivity', v_daily,
    'breakdowns', jsonb_build_object(
      'pages', v_top_pages,
      'referrers', v_referrers,
      'devices', v_devices,
      'countries', v_countries
    ),
    'topPages', v_top_pages,
    'topCountries', v_countries,
    'referrers', v_referrers,
    'devices', v_devices,
    'comparisons', jsonb_build_object(
      'pageViewsChangePercent', v_views_change_pct,
      'uniqueVisitorsChangePercent', v_unique_change_pct,
      'newReadersChangePercent', v_new_readers_change_pct
    )
  );
END;
$$;

-- Update get_community_pulse_stats to delegate seamlessly to dual-table analytics
CREATE OR REPLACE FUNCTION public.get_community_pulse_stats(p_timeframe text DEFAULT '24h')
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT public.get_dual_table_website_analytics(p_timeframe);
$$;

-- Grant execution to public / anon / authenticated so Community Pulse can aggregate safely
GRANT EXECUTE ON FUNCTION public.get_dual_table_website_analytics(text) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_pulse_stats(text) TO PUBLIC, anon, authenticated;
