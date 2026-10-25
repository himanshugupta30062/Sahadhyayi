-- Database security regression checks for analytics RPC grants.
-- Run against a migrated Supabase test database with psql -v ON_ERROR_STOP=1 -f this_file.
DO $test$
DECLARE
  raw_oid oid := 'public.get_dual_table_website_analytics(text)'::regprocedure;
  engagement_oid oid := 'public.get_website_engagement_stats(text)'::regprocedure;
  count_oid oid := 'public.get_website_visit_count()'::regprocedure;
  wrapper_oid oid := 'public.get_admin_website_analytics(text)'::regprocedure;
BEGIN
  ASSERT NOT has_function_privilege('anon', raw_oid, 'EXECUTE');
  ASSERT NOT has_function_privilege('authenticated', raw_oid, 'EXECUTE');
  ASSERT NOT has_function_privilege('anon', engagement_oid, 'EXECUTE');
  ASSERT NOT has_function_privilege('authenticated', engagement_oid, 'EXECUTE');
  ASSERT NOT has_function_privilege('anon', count_oid, 'EXECUTE');
  ASSERT NOT has_function_privilege('authenticated', count_oid, 'EXECUTE');
  ASSERT has_function_privilege('authenticated', wrapper_oid, 'EXECUTE');
  ASSERT NOT has_function_privilege('anon', wrapper_oid, 'EXECUTE');
  ASSERT (SELECT prosecdef FROM pg_proc WHERE oid = wrapper_oid);
  ASSERT (SELECT 'search_path=""' = ANY (proconfig) FROM pg_proc WHERE oid = wrapper_oid);
END;
$test$;
