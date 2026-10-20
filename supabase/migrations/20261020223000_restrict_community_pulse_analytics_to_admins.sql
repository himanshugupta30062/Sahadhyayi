
-- Detailed Community Pulse output includes countries, page paths, referrers and visitor activity.
-- Keep the authoritative aggregate RPCs admin-only and preserve execute access for trusted server code.
CREATE OR REPLACE FUNCTION public.get_community_pulse_stats(p_timeframe text DEFAULT '24h')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  RETURN public.get_dual_table_website_analytics(p_timeframe);
END;
$function$;

DO $secure_dual_table$
DECLARE
  v_definition text;
  v_updated text;
BEGIN
  v_definition := pg_get_functiondef('public.get_dual_table_website_analytics(text)'::regprocedure);
  IF position('IF auth.uid() IS NULL OR NOT public.is_admin()' IN v_definition) = 0 THEN
    v_updated := replace(
      v_definition,
      E'BEGIN\n  IF v_tf NOT IN',
      E'BEGIN\n  IF auth.uid() IS NULL OR NOT public.is_admin() THEN\n    RAISE EXCEPTION ''Access denied: Admin privileges required'';\n  END IF;\n\n  IF v_tf NOT IN'
    );
    IF v_updated = v_definition THEN
      RAISE EXCEPTION 'Could not locate aggregate-function entry block; refusing unsafe patch';
    END IF;
    EXECUTE v_updated;
  END IF;
END
$secure_dual_table$;

DO $secure_city_stats$
DECLARE
  v_definition text;
  v_updated text;
BEGIN
  v_definition := pg_get_functiondef('public.get_community_pulse_city_stats(text)'::regprocedure);
  IF position('IF auth.uid() IS NULL OR NOT public.is_admin()' IN v_definition) = 0 THEN
    v_updated := replace(
      v_definition,
      E'BEGIN\n  IF v_timeframe NOT IN',
      E'BEGIN\n  IF auth.uid() IS NULL OR NOT public.is_admin() THEN\n    RAISE EXCEPTION ''Access denied: Admin privileges required'';\n  END IF;\n\n  IF v_timeframe NOT IN'
    );
    IF v_updated = v_definition THEN
      RAISE EXCEPTION 'Could not locate city-aggregate entry block; refusing unsafe patch';
    END IF;
    EXECUTE v_updated;
  END IF;
END
$secure_city_stats$;

REVOKE ALL ON FUNCTION public.get_community_pulse_stats(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_pulse_stats(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_dual_table_website_analytics(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dual_table_website_analytics(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_community_pulse_city_stats(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_pulse_city_stats(text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
