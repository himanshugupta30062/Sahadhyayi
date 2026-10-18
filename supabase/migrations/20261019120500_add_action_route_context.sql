-- Add route context and safe element-type detail to the aggregate event summary.
CREATE OR REPLACE FUNCTION public.get_community_pulse_action_stats(
  p_timeframe text DEFAULT '24h'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_timeframe text := lower(coalesce(p_timeframe, '24h'));
  v_now timestamptz := now();
  v_period_start timestamptz;
  v_total_actions bigint := 0;
  v_total_interactions bigint := 0;
  v_active_sessions bigint := 0;
  v_average_session_duration_seconds integer := NULL;
  v_duration_sample_count bigint := 0;
  v_action_summary jsonb := '[]'::jsonb;
  v_scroll_depth_summary jsonb := '[]'::jsonb;
BEGIN
  IF v_timeframe NOT IN ('24h', '7d', '30d') THEN
    v_timeframe := '24h';
  END IF;

  v_period_start := v_now - CASE v_timeframe
    WHEN '7d' THEN interval '7 days'
    WHEN '30d' THEN interval '30 days'
    ELSE interval '24 hours'
  END;

  -- Explicit product events, excluding generic DOM interactions and telemetry events.
  SELECT count(*)::bigint
  INTO v_total_actions
  FROM public.website_visits
  WHERE event_type = 'activity'
    AND event_name IS NOT NULL
    AND event_name NOT IN (
      'page_engagement_duration', 'scroll_depth',
      'navigation_click', 'ui_click', 'control_changed', 'form_submitted'
    )
    AND visited_at >= v_period_start
    AND visited_at <= v_now;

  -- Broad click/navigation/control/form interaction telemetry, shown separately from product events.
  SELECT count(*)::bigint
  INTO v_total_interactions
  FROM public.website_visits
  WHERE event_type = 'activity'
    AND event_name IN ('navigation_click', 'ui_click', 'control_changed', 'form_submitted')
    AND visited_at >= v_period_start
    AND visited_at <= v_now;

  SELECT CASE
    WHEN count(session_id) = 0 THEN NULL::bigint
    ELSE count(DISTINCT session_id)
  END
  INTO v_active_sessions
  FROM public.website_visits
  WHERE visited_at >= v_period_start
    AND visited_at <= v_now;

  -- Sum active foreground-time segments per session, then average only sessions with valid samples.
  WITH session_durations AS (
    SELECT
      session_id,
      sum(
        CASE
          WHEN (metadata->>'duration_ms') ~ '^[0-9]{1,8}$'
            THEN least((metadata->>'duration_ms')::numeric, 1800000)
          ELSE 0
        END
      ) AS duration_ms
    FROM public.website_visits
    WHERE event_type = 'activity'
      AND event_name = 'page_engagement_duration'
      AND session_id IS NOT NULL
      AND visited_at >= v_period_start
      AND visited_at <= v_now
    GROUP BY session_id
    HAVING sum(
      CASE
        WHEN (metadata->>'duration_ms') ~ '^[0-9]{1,8}$'
          THEN least((metadata->>'duration_ms')::numeric, 1800000)
        ELSE 0
      END
    ) > 0
  )
  SELECT
    round(avg(duration_ms) / 1000.0)::integer,
    count(*)::bigint
  INTO v_average_session_duration_seconds, v_duration_sample_count
  FROM session_durations;

  -- Group by event plus a short, sanitized UI label so operators can distinguish what was clicked.
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', event_name,
        'label', coalesce(nullif(target_label, ''), nullif(action_detail, ''), initcap(replace(event_name, '_', ' '))),
        'page', page_path,
        'count', amount
      )
      ORDER BY amount DESC, event_name ASC, page_path ASC, target_label ASC
    ),
    '[]'::jsonb
  )
  INTO v_action_summary
  FROM (
    SELECT
      event_name,
      coalesce(nullif(left(btrim(metadata->>'target_label'), 80), ''), '') AS target_label,
      coalesce(
        nullif(left(btrim(metadata->>'form_name'), 80), ''),
        nullif(left(btrim(metadata->>'target_type'), 24), ''),
        nullif(left(btrim(metadata->>'control_type'), 24), ''),
        nullif(left(btrim(metadata->>'section'), 80), ''),
        ''
      ) AS action_detail,
      regexp_replace(
        regexp_replace(coalesce(nullif(left(btrim(page_url), 120), ''), '/'), '/[0-9a-fA-F-]{20,}', '/:id', 'g'),
        '/[0-9]{3,}', '/:id', 'g'
      ) AS page_path,
      count(*)::bigint AS amount
    FROM public.website_visits
    WHERE event_type = 'activity'
      AND event_name IS NOT NULL
      AND event_name NOT IN ('page_engagement_duration', 'scroll_depth')
      AND visited_at >= v_period_start
      AND visited_at <= v_now
    GROUP BY
      event_name,
      coalesce(nullif(left(btrim(metadata->>'target_label'), 80), ''), ''),
      coalesce(
        nullif(left(btrim(metadata->>'form_name'), 80), ''),
        nullif(left(btrim(metadata->>'target_type'), 24), ''),
        nullif(left(btrim(metadata->>'control_type'), 24), ''),
        nullif(left(btrim(metadata->>'section'), 80), ''),
        ''
      ),
      regexp_replace(
        regexp_replace(coalesce(nullif(left(btrim(page_url), 120), ''), '/'), '/[0-9a-fA-F-]{20,}', '/:id', 'g'),
        '/[0-9]{3,}', '/:id', 'g'
      )
    ORDER BY amount DESC, event_name ASC
    LIMIT 30
  ) action_rows;

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object('percent', depth_percent, 'count', amount)
      ORDER BY depth_percent
    ),
    '[]'::jsonb
  )
  INTO v_scroll_depth_summary
  FROM (
    SELECT
      (metadata->>'scroll_depth_percent')::integer AS depth_percent,
      count(*)::bigint AS amount
    FROM public.website_visits
    WHERE event_type = 'activity'
      AND event_name = 'scroll_depth'
      AND metadata->>'scroll_depth_percent' IN ('25', '50', '75', '100')
      AND visited_at >= v_period_start
      AND visited_at <= v_now
    GROUP BY (metadata->>'scroll_depth_percent')::integer
  ) scroll_rows;

  RETURN jsonb_build_object(
    'schemaVersion', 1,
    'timeframe', v_timeframe,
    'totalActions', v_total_actions,
    'totalInteractions', v_total_interactions,
    'actionSummary', v_action_summary,
    'activeSessions', v_active_sessions,
    'averageSessionDurationSeconds', v_average_session_duration_seconds,
    'durationSampleCount', v_duration_sample_count,
    'scrollDepthSummary', v_scroll_depth_summary,
    'lastUpdated', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_community_pulse_action_stats(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_pulse_action_stats(text) TO service_role;

COMMENT ON FUNCTION public.get_community_pulse_action_stats(text) IS
  'Server-only aggregate of product actions, UI interactions, scroll depth, active sessions and measured foreground duration. Returns aggregates only, with normalized route context and no raw visitor identifiers.';
