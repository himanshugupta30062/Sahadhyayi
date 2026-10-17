-- Fix get_total_users_count to count real registered users from auth.users
CREATE OR REPLACE FUNCTION public.get_total_users_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  -- Attempt to count directly from auth.users
  BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.users;
  EXCEPTION WHEN OTHERS THEN
    v_count := NULL;
  END;

  -- If auth.users count is unavailable or 0, fallback to public.profiles
  IF v_count IS NULL OR v_count = 0 THEN
    SELECT COUNT(*) INTO v_count FROM public.profiles;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_total_users_count() TO anon, authenticated, service_role;
