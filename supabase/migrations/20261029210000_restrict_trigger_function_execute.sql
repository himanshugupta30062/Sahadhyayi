-- These routines are invoked by database triggers, not by clients through PostgREST RPC.
-- PostgreSQL trigger execution does not require granting EXECUTE to API roles;
-- remove default/public API-role access while preserving the existing triggers.
REVOKE EXECUTE ON FUNCTION public.join_default_reading_community() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_default_reading_community_group() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_default_reading_community_membership() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_legacy_default_reading_community_group() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_legacy_default_reading_community_membership() FROM PUBLIC, anon, authenticated;
