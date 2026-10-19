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
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id text, visitor_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path text NOT NULL DEFAULT '/', referrer text,
  event_type text NOT NULL DEFAULT 'pageview', event_name text,
  device_type text DEFAULT 'Desktop', country_code text,
  city text, region text, browser text, browser_version text, os text, device_model text,
  screen_resolution text, language text, timezone text,
  utm_source text, utm_medium text, utm_campaign text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.website_visit_events
  ADD COLUMN IF NOT EXISTS event_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city text, ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS browser text, ADD COLUMN IF NOT EXISTS browser_version text,
  ADD COLUMN IF NOT EXISTS os text, ADD COLUMN IF NOT EXISTS device_model text,
  ADD COLUMN IF NOT EXISTS screen_resolution text, ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS timezone text, ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text, ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.website_visit_events SET event_id = gen_random_uuid() WHERE event_id IS NULL;
ALTER TABLE public.website_visit_events
  ALTER COLUMN event_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN event_id SET NOT NULL,
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,
  ALTER COLUMN metadata SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_website_visit_events_event_id
  ON public.website_visit_events(event_id);

-- Consolidate the earlier empty/intermediate table, preserving any rows before removing it.
DO $bridge$
DECLARE v_job_id bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    FOR v_job_id IN SELECT jobid FROM cron.job
      WHERE jobname IN ('website-action-events-retention', 'cleanup-website-visit-events')
    LOOP PERFORM cron.unschedule(v_job_id); END LOOP;
  END IF;
  IF to_regclass('public.website_action_events') IS NOT NULL THEN
    EXECUTE $copy$
      INSERT INTO public.website_visit_events (
        event_id, created_at, session_id, visitor_id, user_id, page_path, referrer,
        event_type, event_name, device_type, country_code, city, region, browser,
        browser_version, os, device_model, screen_resolution, language, timezone,
        utm_source, utm_medium, utm_campaign, metadata
      )
      SELECT e.event_id, e.visited_at, e.session_id::text, e.visitor_id::text, e.user_id,
        coalesce(nullif(e.page_url, ''), '/'), e.referrer,
        CASE WHEN e.event_type IN ('pageview', 'page_view') THEN 'pageview'
             WHEN nullif(e.event_name, '') IS NOT NULL THEN 'activity' ELSE 'pageview' END,
        e.event_name, e.device_type, e.country_code, e.city, e.region, e.browser,
        e.browser_version, e.os, e.device_model, e.screen_resolution, e.language,
        e.timezone, e.utm_source, e.utm_medium, e.utm_campaign, coalesce(e.metadata, '{}'::jsonb)
      FROM public.website_action_events e
      ON CONFLICT (event_id) DO NOTHING
    $copy$;
    DROP TABLE public.website_action_events;
  END IF;
END;
$bridge$;

UPDATE public.website_visit_events
SET event_type = CASE
  WHEN lower(coalesce(event_type, '')) IN ('pageview', 'page_view', '') THEN 'pageview'
  WHEN event_name IS NOT NULL THEN 'activity' ELSE 'pageview' END
WHERE event_type IS NULL OR event_type NOT IN ('pageview', 'activity');
ALTER TABLE public.website_visit_events ALTER COLUMN event_type SET DEFAULT 'pageview';
ALTER TABLE public.website_visit_events DROP CONSTRAINT IF EXISTS website_visit_events_event_type_check;
ALTER TABLE public.website_visit_events
  ADD CONSTRAINT website_visit_events_event_type_check CHECK (event_type IN ('pageview', 'activity'));
ALTER TABLE public.website_visit_events DROP CONSTRAINT IF EXISTS website_visit_events_event_name_format_check;
ALTER TABLE public.website_visit_events
  ADD CONSTRAINT website_visit_events_event_name_format_check
  CHECK (event_name IS NULL OR event_name ~ '^[a-z][a-z0-9_.-]{0,79}$');

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
DROP POLICY IF EXISTS "Admins can view visit events" ON public.website_visit_events;
CREATE POLICY "Admins can view visit events"
  ON public.website_visit_events FOR SELECT USING (public.is_admin());

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

-- Automatic hourly retention for the rolling store only.
DO $retention$
DECLARE v_job_id bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      FOR v_job_id IN SELECT jobid FROM cron.job
        WHERE jobname IN ('website-action-events-retention', 'cleanup-website-visit-events', 'website-visit-events-retention')
      LOOP PERFORM cron.unschedule(v_job_id); END LOOP;
      PERFORM cron.schedule('website-visit-events-retention', '17 * * * *',
        'SELECT public.cleanup_old_website_visit_events();');
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not schedule rolling analytics retention: %', SQLERRM;
    END;
  END IF;
END;
$retention$;

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

  -- Product and UI events are separate from pageview totals.
  v_total_actions bigint := 0;
  v_total_interactions bigint := 0;
  v_active_sessions bigint := NULL;
  v_average_session_duration_seconds integer := NULL;
  v_duration_sample_count bigint := 0;
  v_action_summary jsonb := '[]'::jsonb;
  v_scroll_depth_summary jsonb := '[]'::jsonb;

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
  SELECT count(*) INTO v_lifetime_visits FROM public.website_visits WHERE event_type = 'pageview';

  -- B. Check rolling table event count
  SELECT count(*) INTO v_rolling_total_events FROM public.website_visit_events;

  IF v_rolling_total_events = 0 THEN
    v_is_initial_rollout := true;
  END IF;

  -- C. Rolling period calculations from website_visit_events
  -- If rolling table has accumulated events, calculate from website_visit_events.
  -- Otherwise, if initial rollout, provide fallback from website_visits where event_type = 'pageview'
  -- so the UI transitions smoothly without breaking.
  IF v_rolling_total_events > 0 THEN
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
        ON date_trunc('day', e.created_at) = d.day_ts AND e.event_type = 'pageview'
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
          WHERE e.event_type = 'pageview' AND date_trunc('hour', e.created_at AT TIME ZONE 'Asia/Kolkata') = s.bucket_ist
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
          WHERE e.event_type = 'pageview' AND date_trunc('hour', e.created_at AT TIME ZONE 'Asia/Kolkata') = s.bucket_ist
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

  -- Aggregate activity metrics from the rolling event store.
  SELECT
    count(*) FILTER (WHERE event_name IS NOT NULL AND event_name NOT IN (
      'page_engagement_duration', 'scroll_depth', 'navigation_click', 'ui_click', 'control_changed', 'form_submitted'
    ))::bigint,
    count(*) FILTER (WHERE event_name IN ('navigation_click', 'ui_click', 'control_changed', 'form_submitted'))::bigint
  INTO v_total_actions, v_total_interactions
  FROM public.website_visit_events
  WHERE event_type = 'activity'
    AND created_at >= v_period_start AND created_at <= v_now;

  SELECT CASE WHEN count(session_id) = 0 THEN NULL::bigint ELSE count(DISTINCT session_id) END
  INTO v_active_sessions
  FROM public.website_visit_events
  WHERE created_at >= v_period_start AND created_at <= v_now;

  WITH session_durations AS (
    SELECT session_id,
      sum(CASE WHEN (metadata->>'duration_ms') ~ '^[0-9]{1,8}$'
        THEN least((metadata->>'duration_ms')::numeric, 1800000) ELSE 0 END) AS duration_ms
    FROM public.website_visit_events
    WHERE event_type = 'activity' AND event_name = 'page_engagement_duration'
      AND session_id IS NOT NULL AND created_at >= v_period_start AND created_at <= v_now
    GROUP BY session_id
    HAVING sum(CASE WHEN (metadata->>'duration_ms') ~ '^[0-9]{1,8}$'
      THEN least((metadata->>'duration_ms')::numeric, 1800000) ELSE 0 END) > 0
  )
  SELECT round(avg(duration_ms) / 1000.0)::integer, count(*)::bigint
  INTO v_average_session_duration_seconds, v_duration_sample_count
  FROM session_durations;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'name', event_name,
    'label', coalesce(nullif(target_label, ''), nullif(action_detail, ''), initcap(replace(event_name, '_', ' '))),
    'page', page_path,
    'count', amount
  ) ORDER BY amount DESC, event_name ASC, page_path ASC, target_label ASC), '[]'::jsonb)
  INTO v_action_summary
  FROM (
    SELECT event_name,
      coalesce(nullif(left(btrim(metadata->>'target_label'), 80), ''), '') AS target_label,
      coalesce(nullif(left(btrim(metadata->>'form_name'), 80), ''),
        nullif(left(btrim(metadata->>'target_type'), 24), ''),
        nullif(left(btrim(metadata->>'control_type'), 24), ''),
        nullif(left(btrim(metadata->>'section'), 80), ''), '') AS action_detail,
      regexp_replace(regexp_replace(coalesce(nullif(left(btrim(page_path), 120), ''), '/'),
        '/[0-9a-fA-F-]{20,}', '/:id', 'g'), '/[0-9]{3,}', '/:id', 'g') AS page_path,
      count(*)::bigint AS amount
    FROM public.website_visit_events
    WHERE event_type = 'activity' AND event_name IS NOT NULL
      AND event_name NOT IN ('page_engagement_duration', 'scroll_depth')
      AND created_at >= v_period_start AND created_at <= v_now
    GROUP BY event_name,
      coalesce(nullif(left(btrim(metadata->>'target_label'), 80), ''), ''),
      coalesce(nullif(left(btrim(metadata->>'form_name'), 80), ''),
        nullif(left(btrim(metadata->>'target_type'), 24), ''),
        nullif(left(btrim(metadata->>'control_type'), 24), ''),
        nullif(left(btrim(metadata->>'section'), 80), ''), ''),
      regexp_replace(regexp_replace(coalesce(nullif(left(btrim(page_path), 120), ''), '/'),
        '/[0-9a-fA-F-]{20,}', '/:id', 'g'), '/[0-9]{3,}', '/:id', 'g')
    ORDER BY amount DESC, event_name ASC LIMIT 30
  ) action_rows;

  SELECT coalesce(jsonb_agg(jsonb_build_object('percent', depth_percent, 'count', amount)
    ORDER BY depth_percent), '[]'::jsonb)
  INTO v_scroll_depth_summary
  FROM (
    SELECT (metadata->>'scroll_depth_percent')::integer AS depth_percent, count(*)::bigint AS amount
    FROM public.website_visit_events
    WHERE event_type = 'activity' AND event_name = 'scroll_depth'
      AND metadata->>'scroll_depth_percent' IN ('25', '50', '75', '100')
      AND created_at >= v_period_start AND created_at <= v_now
    GROUP BY (metadata->>'scroll_depth_percent')::integer
  ) scroll_rows;

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
      'uniqueVisitors30d', v_unique_visitors_30d,
      'totalActions', v_total_actions,
      'totalInteractions', v_total_interactions,
      'activeSessions', v_active_sessions,
      'averageSessionDurationSeconds', v_average_session_duration_seconds,
      'durationSampleCount', v_duration_sample_count,
      'actionSummary', v_action_summary,
      'scrollDepthSummary', v_scroll_depth_summary
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

-- Raw action records are only available through this server-side admin-guarded RPC.
CREATE OR REPLACE FUNCTION public.get_admin_recent_actions(
  p_limit integer DEFAULT 50, p_timeframe text DEFAULT '24h'
)
RETURNS TABLE (
  id uuid, created_at timestamptz, event_name text, page_path text,
  visitor_id text, session_id text, user_id uuid, metadata jsonb
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $admin_actions$
DECLARE
  v_timeframe text := lower(coalesce(p_timeframe, '24h'));
  v_period_start timestamptz;
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: only administrators can view action details.'; END IF;
  IF v_timeframe NOT IN ('24h', '7d', '30d') THEN v_timeframe := '24h'; END IF;
  v_period_start := now() - CASE v_timeframe
    WHEN '7d' THEN interval '7 days'
    WHEN '30d' THEN interval '30 days'
    ELSE interval '24 hours' END;
  RETURN QUERY
  SELECT e.id, e.created_at, e.event_name, e.page_path, e.visitor_id, e.session_id, e.user_id,
         coalesce(e.metadata, '{}'::jsonb)
  FROM public.website_visit_events e
  WHERE e.event_type = 'activity' AND e.created_at >= v_period_start AND e.created_at <= now()
  ORDER BY e.created_at DESC LIMIT v_limit;
END;
$admin_actions$;

REVOKE ALL ON FUNCTION public.get_admin_recent_actions(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_recent_actions(integer, text) TO authenticated, service_role;

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
