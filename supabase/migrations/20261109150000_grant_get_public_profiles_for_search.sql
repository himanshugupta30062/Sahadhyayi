-- Grant execute on get_public_profiles_for_search so reader discovery and friends search works reliably
GRANT EXECUTE ON FUNCTION public.get_public_profiles_for_search(text) TO anon, authenticated;

-- Ensure profiles search is fully accessible through the security definer function
COMMENT ON FUNCTION public.get_public_profiles_for_search(text) IS 'Search public profile usernames, names and bios without exposing private location data';

