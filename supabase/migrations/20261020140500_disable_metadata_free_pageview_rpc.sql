-- Page views must be written through the website-visits Edge Function.
-- The Edge Function can derive trusted request IP/country and perform bounded GeoIP enrichment.
-- This SECURITY DEFINER RPC fallback cannot access the visitor's edge request context.
REVOKE ALL ON FUNCTION public.record_pageview(text, text, text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_pageview(text, text, text, text, text, text, text, text)
  TO service_role;

NOTIFY pgrst, 'reload schema';
