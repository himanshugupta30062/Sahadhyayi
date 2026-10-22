-- Security hardening based on verified production profiles schema.
-- Do not rely on table-wide SELECT: precise coordinates, sharing state, and presence are private.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.profiles FROM anon, PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM authenticated, PUBLIC;

-- Clients can read safe profile fields only. Sensitive fields are returned by the owner-only
-- get_my_profile() RPC or consent-aware social/location RPCs.
GRANT SELECT (id, full_name, username, profile_photo_url, bio, writing_frequency,
              stories_read_count, stories_written_count, tags_used, created_at, updated_at)
  ON TABLE public.profiles TO authenticated;
GRANT INSERT (id, full_name, username, profile_photo_url, bio, writing_frequency, tags_used, updated_at)
  ON TABLE public.profiles TO authenticated;
GRANT UPDATE (full_name, username, profile_photo_url, bio, writing_frequency, tags_used, updated_at)
  ON TABLE public.profiles TO authenticated;
GRANT DELETE ON TABLE public.profiles TO authenticated;

-- Detailed analytics must not be public; engagement data is trusted-server/admin only.
REVOKE ALL ON FUNCTION public.get_dual_table_website_analytics(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dual_table_website_analytics(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_website_engagement_stats(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_website_engagement_stats(text) TO service_role;

NOTIFY pgrst, 'reload schema';
