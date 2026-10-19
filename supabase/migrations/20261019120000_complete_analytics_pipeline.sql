-- ============================================================================
-- Migration: 20261019120000_complete_analytics_pipeline.sql
-- Purpose: Complete, Production-Hardened Dual-Table Analytics Pipeline
--
-- Features:
-- 1. Verifies/creates public.website_visit_events with correct indexes & RLS.
-- 2. Normalizes legacy event types ('page_view' -> 'pageview').
-- 3. Implements daily automatic 30-day retention cleanup.
-- 4. Creates secure, public-callable record_pageview RPC for resilient direct ingestion.
-- 5. Canonical get_dual_table_website_analytics RPC with full data contract.
-- 6. Seamless get_community_pulse_stats delegation for backwards compatibility.
-- 7. Unconditionally grants EXECUTE permissions to anon, authenticated, and service_role.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ensure public.website_visit_events table exists
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.website_visit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT,
  visitor_id TEXT,
  page_path TEXT NOT NULL DEFAULT '/',
  referrer TEXT,
  event_type TEXT NOT NULL DEFAULT 'pageview',
  event_name TEXT,
  device_type TEXT DEFAULT 'Desktop',
  country_code TEXT
);

-- Optimize indexes for queries, range aggregations, and rolling retention cleanup
CREATE INDEX IF NOT EXISTS idx_website_visit_events_created_at
  ON public.website_visit_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_visit_events_event_type_created
  ON public.website_visit_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_visit_events_session_created
  ON public.website_visit_events(session_id, created_at DESC)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_website_visit_events_visitor_created
  ON public.website_visit_events(visitor_id, created_at DESC)
  WHERE visitor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_website_visit_events_page_path
  ON public.website_visit_events(page_path, created_at DESC);

-- Ensure indexes on legacy website_visits table
CREATE INDEX IF NOT EXISTS idx_website_visits_event_type_visited
  ON public.website_visits(event_type, visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_visits_visited_at_desc
  ON public.website_visits(visited_at DESC);

-- ----------------------------------------------------------------------------
-- 2. Normalize event types ('page_view', 'view' -> 'pageview')
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Normalize website_visit_events
  UPDATE public.website_visit_events
  SET event_type = 'pageview'
  WHERE lower(event_type) IN ('page_view', 'view');

  -- Normalize legacy website_visits where event_type is variations of pageview
  UPDATE public.website_visits
  SET event_type = 'pageview'
  WHERE lower(event_type) IN ('page_view', 'view') OR event_type IS NULL;
EXCEPTION WHEN OTHERS THEN
  -- Safe failure if columns/table are locked or during read-only phases
  NULL;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Row Level Security & Strict Privacy Controls
-- ----------------------------------------------------------------------------
ALTER TABLE public.website_visit_events ENABLE ROW LEVEL SECURITY;

-- Deny raw direct table access to public, anon, and authenticated users
REVOKE ALL ON TABLE public.website_visit_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.website_visit_events TO service_role;

-- Allow verified administrators to view raw visit events for security audits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'website_visit_events' AND policyname = 'Admins can view visit events'
  ) THEN
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
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Automatic 30-Day Retention Cleanup Function & Job
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
  -- Strictly deletes ONLY from rolling website_visit_events table
  -- Legacy website_visits table is NEVER touched
  DELETE FROM public.website_visit_events
  WHERE created_at < now() - interval '30 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Schedule daily cron via pg_cron if installed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('cleanup-website-visit-events')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-website-visit-events');

      PERFORM cron.schedule(
        'cleanup-website-visit-events',
        '0 3 * * *',
        'SELECT public.cleanup_old_website_visit_events();'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Direct Secure Ingestion RPC: record_pageview
--    Guarantees resilient tracking even if Edge Functions experience cold starts
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_pageview(
  p_page_path text DEFAULT '/',
  p_session_id text DEFAULT NULL,
  p_visitor_id text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_device_type text DEFAULT 'Desktop',
  p_country_code text DEFAULT NULL,
  p_event_name text DEFAULT NULL,
  p_event_type text DEFAULT 'pageview'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_clean_path text;
  v_clean_referrer text;
  v_clean_event_type text := 'pageview';
BEGIN
  -- Sanitize inputs
  v_clean_path := coalesce(nullif(trim(split_part(p_page_path, '?', 1)), ''), '/');
  IF length(v_clean_path) > 300 THEN
    v_clean_path := substr(v_clean_path, 1, 300);
  END IF;

  v_clean_referrer := nullif(trim(p_referrer), '');
  IF length(v_clean_referrer) > 300 THEN
    v_clean_referrer := substr(v_clean_referrer, 1, 300);
  END IF;

  IF lower(p_event_type) IN ('activity', 'event') THEN
    v_clean_event_type := 'activity';
  END IF;

  -- 1. Insert into rolling 30-day website_visit_events
  INSERT INTO public.website_visit_events (
    id,
    created_at,
    session_id,
    visitor_id,
    page_path,
    referrer,
    event_type,
    event_name,
    device_type,
    country_code
  ) VALUES (
    v_id,
    now(),
    nullif(trim(substr(p_session_id, 1, 100)), ''),
    nullif(trim(substr(p_visitor_id, 1, 100)), ''),
    v_clean_path,
    v_clean_referrer,
    v_clean_event_type,
    nullif(trim(substr(p_event_name, 1, 100)), ''),
    coalesce(nullif(trim(p_device_type), ''), 'Desktop'),
    nullif(trim(substr(p_country_code, 1, 10)), '')
  );

  -- 2. Dual-Table bridge: Also preserve in legacy website_visits for lifetime counters
  BEGIN
    INSERT INTO public.website_visits (
      event_type,
      event_name,
      page_url,
      referrer,
      session_id,
      visitor_id,
      device_type,
      country_code,
      visited_at
    ) VALUES (
      v_clean_event_type,
      nullif(trim(substr(p_event_name, 1, 100)), ''),
      v_clean_path,
      v_clean_referrer,
      nullif(trim(substr(p_session_id, 1, 100)), ''),
      nullif(trim(substr(p_visitor_id, 1, 100)), ''),
      coalesce(nullif(trim(p_device_type), ''), 'Desktop'),
      nullif(trim(substr(p_country_code, 1, 10)), ''),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    -- If legacy table insert fails, rolling event is still safely preserved
    NULL;
  END;

  RETURN v_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Authoritative Canonical Analytics RPC: get_dual_table_website_analytics
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

  -- Lifetime metrics (from legacy website_visits table)
  v_lifetime_visits bigint := 0;

  -- Rolling 30-day table telemetry
  v_rolling_total_rows bigint := 0;
  v_rolling_total_pageviews bigint := 0;
  v_period_pageviews bigint := 0;
  v_prev_period_pageviews bigint := 0;
  v_views_change_pct integer := NULL;

  -- Multi-period counts
  v_rolling_24h_views bigint := 0;
  v_rolling_7d_views bigint := 0;
  v_rolling_30d_views bigint := 0;

  -- Unique visitors (stable visitor_id / session_id)
  v_unique_visitors_24h bigint := 0;
  v_unique_visitors_7d bigint := 0;
  v_unique_visitors_30d bigint := 0;
  v_period_unique bigint := 0;
  v_prev_period_unique bigint := 0;
  v_unique_change_pct integer := NULL;

  -- Sessions
  v_period_sessions bigint := 0;

  -- Community membership & signups
  v_registered_readers bigint := 0;
  v_new_registrations bigint := 0;
  v_prev_new_registrations bigint := 0;
  v_registrations_change_pct integer := NULL;

  -- Visual trend collections
  v_hourly jsonb := '[]'::jsonb;
  v_daily jsonb := '[]'::jsonb;
  v_top_pages jsonb := '[]'::jsonb;
  v_referrers jsonb := '[]'::jsonb;
  v_devices jsonb := '[]'::jsonb;
  v_countries jsonb := '[]'::jsonb;

  -- Engagement metrics
  v_book_views bigint := 0;
  v_reading_progress bigint := 0;
  v_group_joins bigint := 0;
  v_discussions bigint := 0;

  -- Status metadata
  v_collection_start_date timestamptz := '2026-10-19 00:00:00+00'::timestamptz;
  v_is_initial_rollout boolean := false;
  v_source_table text := 'public.website_visit_events';
BEGIN
  -- Strict timeframe validation
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

  -- 1. Lifetime Visits from legacy website_visits table
  SELECT count(*) INTO v_lifetime_visits FROM public.website_visits;

  -- 2. Inspect rolling table row counts
  SELECT count(*) INTO v_rolling_total_rows FROM public.website_visit_events;
  SELECT count(*) INTO v_rolling_total_pageviews FROM public.website_visit_events WHERE event_type = 'pageview';

  IF v_rolling_total_rows = 0 THEN
    v_is_initial_rollout := true;
    v_source_table := 'public.website_visits (bridge)';
  END IF;

  -- 3. Calculate Period Metrics
  IF v_rolling_total_rows > 0 THEN
    -- A. Recent Period Views from website_visit_events
    SELECT count(*) INTO v_period_pageviews
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now;

    SELECT count(*) INTO v_prev_period_pageviews
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_prev_start AND created_at < v_prev_end;

    SELECT count(*) INTO v_rolling_24h_views
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_now - interval '24 hours';

    SELECT count(*) INTO v_rolling_7d_views
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_now - interval '7 days';

    SELECT count(*) INTO v_rolling_30d_views
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_now - interval '30 days';

    -- B. Unique Visitors (stable visitor_id / session_id)
    SELECT count(DISTINCT coalesce(visitor_id, session_id)) INTO v_period_unique
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now
      AND (visitor_id IS NOT NULL OR session_id IS NOT NULL);

    SELECT count(DISTINCT coalesce(visitor_id, session_id)) INTO v_prev_period_unique
    FROM public.website_visit_events
    WHERE event_type = 'pageview' AND created_at >= v_prev_start AND created_at < v_prev_end
      AND (visitor_id IS NOT NULL OR session_id IS NOT NULL);

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

    -- C. Sessions count
    SELECT count(DISTINCT session_id) INTO v_period_sessions
    FROM public.website_visit_events
    WHERE created_at >= v_period_start AND created_at <= v_now
      AND session_id IS NOT NULL;

    -- D. Top pages
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_top_pages
    FROM (
      SELECT
        page_path AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_pageviews, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visit_events
      WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now
      GROUP BY page_path
      ORDER BY count(*) DESC
      LIMIT 6
    ) item;

    -- E. Referrers
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_referrers
    FROM (
      SELECT
        coalesce(referrer, 'Direct / Internal') AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_pageviews, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visit_events
      WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now
      GROUP BY 1
      ORDER BY count(*) DESC
      LIMIT 5
    ) item;

    -- F. Devices
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_devices
    FROM (
      SELECT
        coalesce(device_type, 'Desktop') AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_pageviews, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visit_events
      WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now
      GROUP BY 1
      ORDER BY count(*) DESC
    ) item;

    -- G. Countries
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_countries
    FROM (
      SELECT
        country_code AS code,
        country_code AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_pageviews, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visit_events
      WHERE event_type = 'pageview' AND created_at >= v_period_start AND created_at <= v_now
        AND country_code IS NOT NULL
      GROUP BY country_code
      ORDER BY count(*) DESC
      LIMIT 6
    ) item;

    -- H. Daily activity trend (last 30 days)
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
    -- Initial Rollout: Safe bridge calculating from legacy website_visits
    SELECT count(*) INTO v_period_pageviews
    FROM public.website_visits
    WHERE visited_at >= v_period_start AND visited_at <= v_now;

    SELECT count(*) INTO v_prev_period_pageviews
    FROM public.website_visits
    WHERE visited_at >= v_prev_start AND visited_at < v_prev_end;

    SELECT count(*) INTO v_rolling_24h_views
    FROM public.website_visits
    WHERE visited_at >= v_now - interval '24 hours';

    SELECT count(*) INTO v_rolling_7d_views
    FROM public.website_visits
    WHERE visited_at >= v_now - interval '7 days';

    SELECT count(*) INTO v_rolling_30d_views
    FROM public.website_visits
    WHERE visited_at >= v_now - interval '30 days';

    SELECT count(DISTINCT coalesce(visitor_id::text, session_id::text)) INTO v_unique_visitors_24h
    FROM public.website_visits
    WHERE visited_at >= v_now - interval '24 hours';

    SELECT count(DISTINCT coalesce(visitor_id::text, session_id::text)) INTO v_unique_visitors_7d
    FROM public.website_visits
    WHERE visited_at >= v_now - interval '7 days';

    SELECT count(DISTINCT coalesce(visitor_id::text, session_id::text)) INTO v_unique_visitors_30d
    FROM public.website_visits
    WHERE visited_at >= v_now - interval '30 days';

    v_period_unique := CASE
      WHEN v_timeframe = '7d' THEN v_unique_visitors_7d
      WHEN v_timeframe = '30d' THEN v_unique_visitors_30d
      ELSE v_unique_visitors_24h
    END;

    v_period_sessions := v_period_unique;

    -- Top pages from legacy
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_top_pages
    FROM (
      SELECT
        coalesce(page_url, '/') AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_pageviews, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visits
      WHERE visited_at >= v_period_start AND visited_at <= v_now
      GROUP BY 1
      ORDER BY count(*) DESC
      LIMIT 6
    ) item;

    -- Devices from legacy
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_devices
    FROM (
      SELECT
        coalesce(device_type, 'Desktop') AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_pageviews, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visits
      WHERE visited_at >= v_period_start AND visited_at <= v_now
      GROUP BY 1
      ORDER BY count(*) DESC
    ) item;

    -- Countries from legacy
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_countries
    FROM (
      SELECT
        country_code AS code,
        country_code AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_pageviews, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visits
      WHERE visited_at >= v_period_start AND visited_at <= v_now
        AND country_code IS NOT NULL
      GROUP BY country_code
      ORDER BY count(*) DESC
      LIMIT 6
    ) item;

    -- Referrers from legacy
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb) INTO v_referrers
    FROM (
      SELECT
        coalesce(referrer, 'Direct / Internal') AS name,
        count(*)::integer AS count,
        round((count(*)::numeric / NULLIF(v_period_pageviews, 0)::numeric) * 100)::integer AS percent
      FROM public.website_visits
      WHERE visited_at >= v_period_start AND visited_at <= v_now
      GROUP BY 1
      ORDER BY count(*) DESC
      LIMIT 5
    ) item;
  END IF;

  -- 4. Calculate Percentage Comparisons
  IF v_prev_period_pageviews > 0 THEN
    v_views_change_pct := round(((v_period_pageviews - v_prev_period_pageviews)::numeric / v_prev_period_pageviews::numeric) * 100)::integer;
  END IF;

  IF v_prev_period_unique > 0 THEN
    v_unique_change_pct := round(((v_period_unique - v_prev_period_unique)::numeric / v_prev_period_unique::numeric) * 100)::integer;
  END IF;

  -- 5. Registered Members (auth.users with public.profiles fallback)
  BEGIN
    SELECT count(*) INTO v_registered_readers FROM auth.users;
    SELECT count(*) INTO v_new_registrations FROM auth.users WHERE created_at >= v_period_start AND created_at <= v_now;
    SELECT count(*) INTO v_prev_new_registrations FROM auth.users WHERE created_at >= v_prev_start AND created_at < v_prev_end;
  EXCEPTION WHEN OTHERS THEN
    v_registered_readers := 0;
  END;

  IF v_registered_readers = 0 THEN
    SELECT count(*) INTO v_registered_readers FROM public.profiles;
    SELECT count(*) INTO v_new_registrations FROM public.profiles WHERE created_at >= v_period_start AND created_at <= v_now;
    SELECT count(*) INTO v_prev_new_registrations FROM public.profiles WHERE created_at >= v_prev_start AND created_at < v_prev_end;
  END IF;

  IF v_prev_new_registrations > 0 THEN
    v_registrations_change_pct := round(((v_new_registrations - v_prev_new_registrations)::numeric / v_prev_new_registrations::numeric) * 100)::integer;
  END IF;

  -- 6. Reading Engagement
  BEGIN
    SELECT count(*) INTO v_book_views
    FROM public.website_visits
    WHERE visited_at >= v_period_start AND (
      event_name IN ('book_opened', 'discovery_book_opened', 'reading_started')
      OR page_url ILIKE '%/book/%'
      OR page_url ILIKE '%/reader/%'
    );
  EXCEPTION WHEN OTHERS THEN
    v_book_views := 0;
  END;

  BEGIN
    SELECT count(*) INTO v_reading_progress
    FROM public.reading_room_events
    WHERE created_at >= v_period_start AND kind = 'chapter_complete';
  EXCEPTION WHEN OTHERS THEN
    v_reading_progress := 0;
  END;

  BEGIN
    SELECT count(*) INTO v_group_joins
    FROM public.group_members
    WHERE joined_at >= v_period_start;
  EXCEPTION WHEN OTHERS THEN
    v_group_joins := 0;
  END;

  BEGIN
    SELECT count(*) INTO v_discussions
    FROM (
      SELECT id FROM public.posts WHERE created_at >= v_period_start
      UNION ALL
      SELECT id FROM public.post_comments WHERE created_at >= v_period_start
    ) disc;
  EXCEPTION WHEN OTHERS THEN
    v_discussions := 0;
  END;

  -- 7. 24 Hourly Buckets (Asia/Kolkata timezone) for the last 24h
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
        CASE WHEN v_rolling_total_rows > 0 THEN (
          SELECT count(*)
          FROM public.website_visit_events e
          WHERE e.event_type = 'pageview'
            AND date_trunc('hour', e.created_at AT TIME ZONE 'Asia/Kolkata') = s.bucket_ist
        ) ELSE (
          SELECT count(*)
          FROM public.website_visits w
          WHERE date_trunc('hour', w.visited_at AT TIME ZONE 'Asia/Kolkata') = s.bucket_ist
        ) END,
        0
      )::integer,
      'count', coalesce(
        CASE WHEN v_rolling_total_rows > 0 THEN (
          SELECT count(*)
          FROM public.website_visit_events e
          WHERE e.event_type = 'pageview'
            AND date_trunc('hour', e.created_at AT TIME ZONE 'Asia/Kolkata') = s.bucket_ist
        ) ELSE (
          SELECT count(*)
          FROM public.website_visits w
          WHERE date_trunc('hour', w.visited_at AT TIME ZONE 'Asia/Kolkata') = s.bucket_ist
        ) END,
        0
      )::integer,
      'isPeak', false
    ) AS hour_item
    FROM hour_series s
  ) h_sub;

  -- Annotate peak hour
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

  -- Return complete dual-table analytics contract
  RETURN jsonb_build_object(
    'success', true,
    'timeframe', v_timeframe,
    'generatedAt', v_now,
    'lastUpdated', v_now,
    'collectionStartedAt', v_collection_start_date,

    -- Data coverage health metadata
    'dataCoverage', jsonb_build_object(
      'legacyLifetimeAvailable', true,
      'rollingEventsAvailable', v_rolling_total_rows > 0,
      'isInitialRollout', v_is_initial_rollout,
      'isPartial', false,
      'sourceTable', v_source_table,
      'totalRollingRows', v_rolling_total_rows
    ),

    -- Section 1: Lifetime Universal Data
    'lifetime', jsonb_build_object(
      'totalVisits', v_lifetime_visits,
      'sourceTable', 'public.website_visits',
      'label', 'All-Time Visits'
    ),

    -- Section 2: Selected-Period Metrics (Driven strictly by dropdown)
    'period', jsonb_build_object(
      'pageViews', v_period_pageviews,
      'uniqueVisitors', v_period_unique,
      'sessions', v_period_sessions,
      'newVisitors', v_period_unique,
      'returningVisitors', 0,
      'registeredReaders', v_registered_readers,
      'newRegistrations', v_new_registrations
    ),

    -- Section 3: Period Comparisons
    'comparison', jsonb_build_object(
      'previousPeriodPageViews', v_prev_period_pageviews,
      'pageViewsChangePercent', v_views_change_pct,
      'uniqueVisitorsChangePercent', v_unique_change_pct,
      'newRegistrationsChangePercent', v_registrations_change_pct
    ),

    -- Section 4: Rolling Multi-period Telemetry
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

    -- Section 5: Timeseries & Visual Trends
    'timeseries', v_hourly,
    'hourlyActivity', v_hourly,
    'dailyActivity', v_daily,

    -- Section 6: Categorical Breakdowns
    'breakdowns', jsonb_build_object(
      'pages', v_top_pages,
      'referrers', v_referrers,
      'devices', v_devices,
      'countries', v_countries
    ),

    -- Section 7: Community Engagement Metrics
    'engagement', jsonb_build_object(
      'bookViews', v_book_views,
      'readingProgressUpdates', v_reading_progress,
      'groupJoins', v_group_joins,
      'discussions', v_discussions,
      'searches', 0
    ),

    -- Backwards-compatibility top-level bindings for existing consumers & tests
    'pageViews', v_period_pageviews,
    'totalVisits', v_lifetime_visits,
    'last24hVisits', v_rolling_24h_views,
    'uniqueVisitors', v_period_unique,
    'uniqueVisitors24h', v_unique_visitors_24h,
    'totalMembers', v_registered_readers,
    'registeredReaders', v_registered_readers,
    'newReaders', v_new_registrations,
    'newSignups24h', v_new_registrations,
    'topPages', v_top_pages,
    'topCountries', v_countries,
    'referrers', v_referrers,
    'devices', v_devices,
    'readingEngagement', jsonb_build_object(
      'bookViews', jsonb_build_object('count', v_book_views, 'tracked', true),
      'readingProgressUpdates', jsonb_build_object('count', v_reading_progress, 'tracked', true),
      'groupJoinsCount', jsonb_build_object('count', v_group_joins, 'tracked', true),
      'discussionsCount', jsonb_build_object('count', v_discussions, 'tracked', true)
    ),
    'comparisons', jsonb_build_object(
      'pageViewsChangePercent', v_views_change_pct,
      'uniqueVisitorsChangePercent', v_unique_change_pct,
      'newReadersChangePercent', v_registrations_change_pct
    )
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. Update get_community_pulse_stats to delegate seamlessly to dual-table analytics
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_community_pulse_stats(p_timeframe text DEFAULT '24h')
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT public.get_dual_table_website_analytics(p_timeframe);
$$;

-- ----------------------------------------------------------------------------
-- 8. Unconditionally Grant EXECUTE to public / anon / authenticated / service_role
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_dual_table_website_analytics(text) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_community_pulse_stats(text) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_pageview(text, text, text, text, text, text, text, text) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_website_visit_count() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_total_users_count() TO PUBLIC, anon, authenticated, service_role;
