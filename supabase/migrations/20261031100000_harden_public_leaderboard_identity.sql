-- Minimize personally identifying data returned by the public game leaderboard.
-- Preserve the existing RPC shape for backwards compatibility, but expose only the
-- public username as the display label and never return profile photos/full names.
CREATE OR REPLACE FUNCTION public.get_game_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_photo_url text,
  total_points integer,
  games_won integer,
  rank text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(limit_count, 10), 1), 100);
BEGIN
  RETURN QUERY
  SELECT
    ugs.user_id,
    COALESCE(NULLIF(btrim(p.username), ''), 'Reader') AS username,
    COALESCE(NULLIF(btrim(p.username), ''), 'Reader') AS full_name,
    NULL::text AS profile_photo_url,
    ugs.total_points,
    ugs.games_won,
    ugs.rank
  FROM public.user_game_stats AS ugs
  JOIN public.profiles AS p ON p.id = ugs.user_id
  ORDER BY ugs.total_points DESC, ugs.games_won DESC, ugs.user_id
  LIMIT v_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_game_leaderboard(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_game_leaderboard(integer) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_game_leaderboard(integer) IS
  'Public game leaderboard; returns username and game aggregates only, never full name or profile photo.';
