-- Narrow admin-gated browser access to aggregate analytics; keep raw engagement RPC service-only.
CREATE OR REPLACE FUNCTION public.get_admin_website_analytics(p_timeframe text DEFAULT '24h')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required' USING ERRCODE = '42501';
  END IF;
  RETURN public.get_dual_table_website_analytics(p_timeframe);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_website_analytics(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_website_analytics(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_dual_table_website_analytics(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dual_table_website_analytics(text) TO service_role;
REVOKE ALL ON FUNCTION public.get_website_engagement_stats(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_website_engagement_stats(text) TO service_role;
REVOKE ALL ON FUNCTION public.get_website_visit_count() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_website_visit_count() TO service_role;
ALTER FUNCTION public.get_dual_table_website_analytics(text) SET search_path = '';
