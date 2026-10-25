-- Expose only aggregate community counts to public UI; never expose raw visitor rows.
CREATE OR REPLACE FUNCTION public.get_public_community_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT jsonb_build_object(
    'totalSignups', (SELECT count(*) FROM public.profiles),
    'totalVisits', (
      SELECT count(*) FROM public.website_visits WHERE event_type = 'pageview'
    ),
    'last24hVisits', (
      SELECT count(*) FROM public.website_visits
      WHERE event_type = 'pageview'
        AND visited_at >= now() - interval '24 hours'
    ),
    'lastUpdated', now()
  );
$function$;

REVOKE ALL ON FUNCTION public.get_public_community_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_community_counts() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_public_community_counts() IS
  'Returns aggregate-only community counts for public UI; exposes no individual user or visitor records.';
