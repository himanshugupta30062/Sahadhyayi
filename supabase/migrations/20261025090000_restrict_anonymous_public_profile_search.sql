-- Keep profile search available to signed-in readers, but prevent anonymous enumeration.
-- The function returns profile fields while running as its owner, bypassing profiles RLS.
REVOKE ALL ON FUNCTION public.get_public_profiles_for_search(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles_for_search(text) TO authenticated, service_role;
