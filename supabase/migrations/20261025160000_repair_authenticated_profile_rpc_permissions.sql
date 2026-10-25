-- Restore least-privilege access for the owner-scoped profile RPCs.
-- The functions remain unavailable to anonymous users and PUBLIC.
GRANT USAGE ON SCHEMA public TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

REVOKE ALL ON FUNCTION public.update_my_profile(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile(jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
