-- Sahadhyayi Live Website Stats: read-only backend audit
-- Run each section in the Supabase SQL Editor on the production project.
-- These statements return aggregate counts only; they do not expose visitor rows.

-- 1. Confirm which analytics RPC definitions exist and who can execute them.
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  p.prosecdef AS security_definer,
  pg_get_userbyid(p.proowner) AS function_owner,
  COALESCE(array_to_string(p.proacl, ', '), 'default ACL') AS access_list
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_community_pulse_stats',
    'get_community_pulse_city_stats',
    'get_total_users_count',
    'get_website_visit_count'
  )
ORDER BY p.proname;

-- 2. Check visit capture coverage. Low populated-field counts explain empty panels.
SELECT
  count(*) FILTER (WHERE event_type = 'pageview') AS lifetime_pageviews,
  count(*) FILTER (
    WHERE event_type = 'pageview'
      AND visited_at >= now() - interval '24 hours'
  ) AS pageviews_last_24h,
  count(*) FILTER (
    WHERE event_type = 'pageview'
      AND visited_at >= now() - interval '7 days'
  ) AS pageviews_last_7d,
  count(*) FILTER (WHERE event_type IS NULL) AS rows_missing_event_type,
  count(*) FILTER (
    WHERE event_type = 'pageview'
      AND visitor_id IS NULL AND session_id IS NULL
  ) AS pageviews_without_visitor_or_session_id,
  count(*) FILTER (
    WHERE event_type = 'pageview' AND nullif(trim(country_code), '') IS NULL
  ) AS pageviews_without_country,
  count(*) FILTER (
    WHERE event_type = 'pageview' AND nullif(trim(city), '') IS NULL
  ) AS pageviews_without_city,
  count(*) FILTER (
    WHERE event_type = 'pageview' AND nullif(trim(device_type), '') IS NULL
  ) AS pageviews_without_device_type,
  count(*) FILTER (
    WHERE event_type = 'pageview' AND nullif(trim(page_url), '') IS NULL
  ) AS pageviews_without_page_url,
  count(*) FILTER (
    WHERE event_type = 'pageview' AND nullif(trim(referrer), '') IS NULL
  ) AS pageviews_without_referrer
FROM public.website_visits;

-- 3. Check whether the current aggregate RPC returns the contract expected by the UI.
-- If this errors, capture the exact database error: the Edge Function will use its
-- count-only fallback, so country/page/device/referrer breakdowns will be unavailable.
SELECT public.get_community_pulse_stats('24h') AS live_website_stats_payload;

-- 4. After migration 20261019093000_add_community_pulse_city_aggregates.sql is applied,
-- verify that the city aggregate exists and returns grouped results.
SELECT public.get_community_pulse_city_stats('24h') AS live_city_stats_payload;

-- 5. Quick sample of the aggregate sources behind the breakdowns (last 24 hours).
SELECT
  count(*) AS pageviews_last_24h,
  count(*) FILTER (WHERE nullif(trim(country_code), '') IS NOT NULL) AS pageviews_with_country,
  count(*) FILTER (WHERE nullif(trim(city), '') IS NOT NULL) AS pageviews_with_city,
  count(*) FILTER (WHERE nullif(trim(device_type), '') IS NOT NULL) AS pageviews_with_device,
  count(*) FILTER (WHERE nullif(trim(page_url), '') IS NOT NULL) AS pageviews_with_page,
  count(*) FILTER (WHERE nullif(trim(referrer), '') IS NOT NULL) AS pageviews_with_referrer
FROM public.website_visits
WHERE event_type = 'pageview'
  AND visited_at >= now() - interval '24 hours';
