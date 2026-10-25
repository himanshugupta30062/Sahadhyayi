-- This aggregate exposes detailed action names, page paths, and session engagement metadata.
-- No application callers were found; only the generated type declaration remains.
-- Keep browser roles blocked until a guarded admin-only consumer is implemented.
REVOKE ALL ON FUNCTION public.get_community_pulse_action_stats(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_pulse_action_stats(text) TO service_role;
