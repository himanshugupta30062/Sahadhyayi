
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_type t ON t.oid = p.prorettype
    WHERE n.nspname='public'
      AND p.prosecdef = true
      AND t.typname = 'trigger'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, authenticated, public',
                   fn.nspname, fn.proname, fn.args);
  END LOOP;
END
$$;

-- Also revoke from clearly internal/admin-only functions
REVOKE EXECUTE ON FUNCTION public.cleanup_unused_books() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.link_books_to_authors() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_author_book_counts() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.refresh_book_ratings_agg(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_author_followers(uuid, text, text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_contact_messages_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_location_analytics() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_location_usage_analytics() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_visit_statistics() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_website_visit(text, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_website_visit(inet, text, text, text) FROM anon, public;
