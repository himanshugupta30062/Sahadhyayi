-- Keep raw analytics RPCs service-role-only; browser callers must use the admin-gated wrapper.
-- Reassert the intended ACLs so temporary troubleshooting grants cannot persist.
REVOKE ALL ON FUNCTION public.get_dual_table_website_analytics(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_website_engagement_stats(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_website_visit_count() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_dual_table_website_analytics(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_website_engagement_stats(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_website_visit_count() TO service_role;

-- The wrapper is the only authenticated entry point and checks auth.uid() + is_admin().
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

-- Fail the migration if the security invariants drift.
DO $verify$
DECLARE
  raw_oid oid;
  engagement_oid oid;
  count_oid oid;
  wrapper_oid oid;
BEGIN
  raw_oid := 'public.get_dual_table_website_analytics(text)'::regprocedure;
  engagement_oid := 'public.get_website_engagement_stats(text)'::regprocedure;
  count_oid := 'public.get_website_visit_count()'::regprocedure;
  wrapper_oid := 'public.get_admin_website_analytics(text)'::regprocedure;

  IF has_function_privilege('anon', raw_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', raw_oid, 'EXECUTE')
     OR has_function_privilege('anon', engagement_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', engagement_oid, 'EXECUTE')
     OR has_function_privilege('anon', count_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', count_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'Raw analytics RPCs must remain service-role-only';
  END IF;

  IF NOT has_function_privilege('authenticated', wrapper_oid, 'EXECUTE')
     OR has_function_privilege('anon', wrapper_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'Admin analytics wrapper grants are invalid';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid = wrapper_oid
      AND p.prosecdef
      AND 'search_path=""' = ANY (p.proconfig)
  ) THEN
    RAISE EXCEPTION 'Admin analytics wrapper must be SECURITY DEFINER with an empty search_path';
  END IF;
END;
$verify$;
