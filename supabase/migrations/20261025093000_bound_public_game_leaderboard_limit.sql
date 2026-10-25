-- Bound public leaderboard work so callers cannot request an unbounded result set.
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
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(limit_count, 10), 1), 100);
BEGIN
  RETURN QUERY
  SELECT
    ugs.user_id,
    p.username,
    p.full_name,
    p.profile_photo_url,
    ugs.total_points,
    ugs.games_won,
    ugs.rank
  FROM public.user_game_stats AS ugs
  JOIN public.profiles AS p ON p.id = ugs.user_id
  ORDER BY ugs.total_points DESC
  LIMIT v_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_game_leaderboard(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_game_leaderboard(integer) TO anon, authenticated, service_role;
