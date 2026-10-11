-- Add session-aware event fields while preserving legacy pageview rows.
ALTER TABLE public.website_visits
  ADD COLUMN IF NOT EXISTS event_id uuid,
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'pageview',
  ADD COLUMN IF NOT EXISTS event_name text,
  ADD COLUMN IF NOT EXISTS session_id uuid,
  ADD COLUMN IF NOT EXISTS visitor_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;

CREATE UNIQUE INDEX IF NOT EXISTS website_visits_event_id_uidx
  ON public.website_visits(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS website_visits_visited_at_idx ON public.website_visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS website_visits_session_visited_idx
  ON public.website_visits(session_id, visited_at DESC) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS website_visits_visitor_visited_idx
  ON public.website_visits(visitor_id, visited_at DESC) WHERE visitor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS website_visits_event_user_idx
  ON public.website_visits(event_name, user_id, visited_at DESC) WHERE user_id IS NOT NULL;

ALTER TABLE public.website_visits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.website_visits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.website_visits TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_website_visit_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_visit_statistics() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_website_visit(text, text, text) FROM PUBLIC, anon, authenticated;

-- Public RPC returns reading-community aggregates only. Detailed visitor data
-- remains behind the authenticated admin RPC below.
CREATE OR REPLACE FUNCTION public.get_public_community_pulse()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  WITH days AS (
    SELECT generate_series(date_trunc('day', now()) - interval '29 days',
      date_trunc('day', now()), interval '1 day') AS day
  ), activity AS (
    SELECT date_trunc('day', p.created_at) AS day, count(*) AS amount
      FROM public.posts p WHERE p.created_at >= date_trunc('day', now()) - interval '29 days' GROUP BY 1
    UNION ALL
    SELECT date_trunc('day', c.created_at), count(*)
      FROM public.post_comments c WHERE c.created_at >= date_trunc('day', now()) - interval '29 days' GROUP BY 1
    UNION ALL
    SELECT date_trunc('day', e.created_at), count(*)
      FROM public.reading_room_events e
      WHERE e.created_at >= date_trunc('day', now()) - interval '29 days' AND e.kind = 'chapter_complete' GROUP BY 1
  ), daily AS (
    SELECT d.day, coalesce(sum(a.amount), 0)::integer AS count
      FROM days d LEFT JOIN activity a USING (day) GROUP BY d.day
  ), active_rooms AS (
    SELECT count(*)::integer AS count FROM public.reading_rooms r
    WHERE EXISTS (SELECT 1 FROM public.reading_room_messages m
      WHERE m.room_id = r.id AND m.created_at >= now() - interval '30 days')
      OR EXISTS (SELECT 1 FROM public.reading_room_events e
      WHERE e.room_id = r.id AND e.created_at >= now() - interval '30 days')
  )
  SELECT jsonb_build_object(
    'registeredReaders', (SELECT count(*)::integer FROM public.profiles),
    'eligibleBooks', (SELECT count(DISTINCT lower(trim(b.title)))::integer
      FROM public.books_library b WHERE nullif(trim(b.title), '') IS NOT NULL),
    'activeRooms', (SELECT count FROM active_rooms),
    'communityActivity',
      (SELECT count(*) FROM public.post_comments WHERE created_at >= now() - interval '30 days') +
      (SELECT count(*) FROM public.reading_room_messages WHERE created_at >= now() - interval '30 days') +
      (SELECT count(*) FROM public.reading_room_events
        WHERE kind = 'chapter_complete' AND created_at >= now() - interval '30 days'),
    'activityTrend', coalesce((SELECT jsonb_agg(jsonb_build_object('day', day::date, 'count', count) ORDER BY day) FROM daily), '[]'::jsonb),
    'lastUpdated', now()
  );
$$;
REVOKE ALL ON FUNCTION public.get_public_community_pulse() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_community_pulse() TO service_role;

CREATE OR REPLACE FUNCTION public.get_admin_analytics(p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  v_days integer := greatest(1, least(coalesce(p_days, 30), 90));
  v_start timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 90)));
  v_previous timestamptz := now() - make_interval(days => 2 * greatest(1, least(coalesce(p_days, 30), 90)));
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = '42501';
  END IF;

  WITH rows AS (
    SELECT w.*, coalesce(nullif(split_part(split_part(w.page_url, '?', 1), '#', 1), ''), '/') AS clean_page
    FROM public.website_visits w WHERE w.visited_at >= v_previous
  ), current_rows AS (
    SELECT * FROM rows WHERE visited_at >= v_start
  ), kpi AS (
    SELECT
      count(*) FILTER (WHERE event_type = 'pageview')::integer AS pageviews,
      count(DISTINCT session_id) FILTER (WHERE event_type = 'pageview' AND session_id IS NOT NULL)::integer AS sessions,
      count(DISTINCT visitor_id) FILTER (WHERE event_type = 'pageview' AND visitor_id IS NOT NULL)::integer AS visitors,
      count(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::integer AS readers
    FROM current_rows
  ), prior AS (
    SELECT
      count(*) FILTER (WHERE event_type = 'pageview')::integer AS pageviews,
      count(DISTINCT session_id) FILTER (WHERE event_type = 'pageview' AND session_id IS NOT NULL)::integer AS sessions,
      count(DISTINCT visitor_id) FILTER (WHERE event_type = 'pageview' AND visitor_id IS NOT NULL)::integer AS visitors,
      count(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::integer AS readers
    FROM rows WHERE visited_at < v_start
  ), signup AS (
    SELECT count(*)::integer AS amount FROM public.profiles WHERE created_at >= v_start
  ), prior_signup AS (
    SELECT count(*)::integer AS amount FROM public.profiles WHERE created_at >= v_previous AND created_at < v_start
  ), days AS (
    SELECT date_trunc('day', now()) - (v_days - n.n) * interval '1 day' AS day
    FROM generate_series(0, v_days - 1) n
  ), trend AS (
    SELECT d.day,
      count(r.id) FILTER (WHERE r.event_type = 'pageview')::integer AS pageviews,
      count(DISTINCT r.session_id) FILTER (WHERE r.event_type = 'pageview' AND r.session_id IS NOT NULL)::integer AS sessions
    FROM days d LEFT JOIN current_rows r ON r.visited_at >= d.day AND r.visited_at < d.day + interval '1 day'
    GROUP BY d.day ORDER BY d.day
  ), engagements AS (
    SELECT
      count(*) FILTER (WHERE event_name IN ('book_opened','discovery_book_opened') OR clean_page LIKE '/book/%')::integer AS book_opens,
      count(*) FILTER (WHERE event_name = 'book_saved')::integer AS book_saves,
      count(*) FILTER (WHERE event_name = 'reading_started')::integer AS reading_starts,
      count(*) FILTER (WHERE event_name = 'reading_completed')::integer AS reading_completions,
      count(*) FILTER (WHERE event_name = 'group_participation')::integer AS group_participation,
      count(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL AND visited_at >= now() - interval '7 days')::integer AS wau,
      count(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL AND visited_at >= now() - interval '30 days')::integer AS mau
    FROM current_rows
  ), top_pages AS (
    SELECT coalesce(jsonb_agg(jsonb_build_object('name', clean_page, 'count', amount) ORDER BY amount DESC), '[]'::jsonb) AS data
    FROM (SELECT clean_page, count(*)::integer AS amount FROM current_rows
      WHERE event_type = 'pageview' GROUP BY clean_page ORDER BY amount DESC LIMIT 10) q
  ), entry_pages AS (
    SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'count', amount) ORDER BY amount DESC), '[]'::jsonb) AS data
    FROM (
      SELECT clean_page AS name, count(*)::integer AS amount
      FROM (
        SELECT DISTINCT ON (session_id) session_id, clean_page
        FROM current_rows
        WHERE session_id IS NOT NULL AND event_type = 'pageview'
        ORDER BY session_id, visited_at
      ) first_page
      GROUP BY clean_page ORDER BY amount DESC LIMIT 10
    ) q
  ), referrers AS (
    SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'count', amount) ORDER BY amount DESC), '[]'::jsonb) AS data
    FROM (SELECT CASE WHEN position('://' in referrer) > 0 THEN split_part(split_part(referrer, '://', 2), '/', 1) ELSE split_part(referrer, '/', 1) END AS name,
      count(*)::integer AS amount FROM current_rows WHERE referrer IS NOT NULL AND referrer <> ''
      GROUP BY 1 ORDER BY amount DESC LIMIT 10) q
  ), campaigns AS (
    SELECT coalesce(jsonb_agg(jsonb_build_object('name', coalesce(utm_campaign, utm_source, 'Unattributed'),
      'source', coalesce(utm_source, '—'), 'medium', coalesce(utm_medium, '—'), 'count', amount) ORDER BY amount DESC), '[]'::jsonb) AS data
    FROM (SELECT utm_campaign, utm_source, utm_medium, count(*)::integer AS amount FROM current_rows
      WHERE utm_source IS NOT NULL OR utm_campaign IS NOT NULL GROUP BY 1,2,3 ORDER BY amount DESC LIMIT 10) q
  ), countries AS (
    SELECT coalesce(jsonb_agg(jsonb_build_object('name', country_code, 'count', amount) ORDER BY amount DESC), '[]'::jsonb) AS data
    FROM (SELECT country_code, count(DISTINCT session_id)::integer AS amount FROM current_rows
      WHERE country_code IS NOT NULL AND session_id IS NOT NULL GROUP BY 1
      HAVING count(DISTINCT session_id) >= 10 ORDER BY amount DESC LIMIT 10) q
  ), devices AS (
    SELECT coalesce(jsonb_agg(jsonb_build_object('name', device_type, 'count', amount) ORDER BY amount DESC), '[]'::jsonb) AS data
    FROM (SELECT device_type, count(DISTINCT session_id)::integer AS amount FROM current_rows
      WHERE device_type IS NOT NULL AND session_id IS NOT NULL GROUP BY 1
      HAVING count(DISTINCT session_id) >= 10 ORDER BY amount DESC LIMIT 10) q
  )
  SELECT jsonb_build_object(
    'days', v_days,
    'current', jsonb_build_object('visitors', k.visitors, 'sessions', k.sessions, 'pageviews', k.pageviews,
      'signups', s.amount, 'activeReaders', k.readers,
      'signupConversion', CASE WHEN k.visitors > 0 THEN round(s.amount::numeric * 100 / k.visitors, 2) ELSE 0 END),
    'previous', jsonb_build_object('visitors', p.visitors, 'sessions', p.sessions, 'pageviews', p.pageviews,
      'signups', ps.amount, 'activeReaders', p.readers),
    'trend', coalesce((SELECT jsonb_agg(jsonb_build_object('day', day::date, 'pageviews', pageviews, 'sessions', sessions) ORDER BY day) FROM trend), '[]'::jsonb),
    'topPages', tp.data, 'entryPages', ep.data, 'referrers', rf.data, 'campaigns', ca.data,
    'countries', co.data, 'devices', dv.data,
    'engagement', jsonb_build_object('weeklyActiveReaders', e.wau, 'monthlyActiveReaders', e.mau,
      'bookOpens', e.book_opens, 'bookSaves', e.book_saves, 'readingStarts', e.reading_starts,
      'readingCompletions', e.reading_completions, 'groupParticipation', e.group_participation),
    'funnel', jsonb_build_array(
      jsonb_build_object('name','Visitors','count',k.visitors),
      jsonb_build_object('name','Signups','count',s.amount),
      jsonb_build_object('name','Book engagement','count',e.book_opens),
      jsonb_build_object('name','Reading starts','count',e.reading_starts)),
    'definitions', jsonb_build_object(
      'visitors','Distinct first-party browser IDs among pageviews; older events without IDs are excluded.',
      'sessions','Distinct first-party sessions among pageviews; session IDs rotate after 30 minutes idle.',
      'pageviews','Recorded pageview events, including historical website_visits rows.',
      'signups','Profiles created in the selected date range. Conversion is aggregate signups / measured visitors.',
      'activeReaders','Distinct authenticated users with recorded events in the selected range.',
      'countriesAndDevices','Only categories with 10 or more measured sessions are shown.'),
    'lastUpdated', now())
  INTO v_result
  FROM kpi k, prior p, signup s, prior_signup ps, engagements e, top_pages tp, entry_pages ep, referrers rf, campaigns ca, countries co, devices dv;

  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_admin_analytics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics(integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
