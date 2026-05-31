
-- Fix mutable search_path on record_website_visit(text,text,text)
CREATE OR REPLACE FUNCTION public.record_website_visit(ip_addr text DEFAULT NULL::text, user_agent_string text DEFAULT NULL::text, page text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.website_visits (ip_address, user_agent, page_url)
  VALUES (ip_addr::inet, user_agent_string, page);
END;
$function$;

-- security_audit_log: remove permissive authenticated INSERT (service_role/SECURITY DEFINER triggers will still work)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;

-- website_visits: remove permissive public INSERT. Edge function uses service_role which bypasses RLS.
DROP POLICY IF EXISTS "System can record visits" ON public.website_visits;

-- user_game_badges: restrict public read to authenticated users only
DROP POLICY IF EXISTS "Anyone can view user badges" ON public.user_game_badges;
CREATE POLICY "Authenticated users can view badges"
  ON public.user_game_badges
  FOR SELECT
  TO authenticated
  USING (true);

-- user_game_stats: restrict leaderboard reads to authenticated users
DROP POLICY IF EXISTS "Anyone can view leaderboard stats" ON public.user_game_stats;
CREATE POLICY "Authenticated users can view leaderboard"
  ON public.user_game_stats
  FOR SELECT
  TO authenticated
  USING (true);
