-- Tighten sensitive profile access and keep raw analytics admin-only.
-- The public_profiles view and consent-aware location RPCs are the supported cross-user paths.

REVOKE INSERT, UPDATE, DELETE ON TABLE public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.profiles FROM PUBLIC;

-- Precise location, sharing state, and activity timestamps must not be fetched directly
-- from profiles. Own-profile reads go through get_my_profile(); cross-user location
-- goes through the consent-checked location/social RPCs.
REVOKE SELECT (location_lat, location_lng, location_sharing, last_seen)
  ON TABLE public.profiles FROM authenticated, anon, PUBLIC;

-- Raw detailed visitor/session analytics is internal/admin functionality.
REVOKE ALL ON FUNCTION public.get_dual_table_website_analytics(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dual_table_website_analytics(text) TO authenticated, service_role;

-- Engagement data is admin-only. The database function itself checks is_admin();
-- execution is limited to trusted server-side calls to prevent ordinary clients invoking it.
REVOKE ALL ON FUNCTION public.get_website_engagement_stats(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_website_engagement_stats(text) TO service_role;

NOTIFY pgrst, 'reload schema';
