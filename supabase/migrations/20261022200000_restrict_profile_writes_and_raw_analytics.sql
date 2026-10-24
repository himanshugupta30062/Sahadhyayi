-- Match currently verified production privileges, preserving app-owned safe column writes.
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM anon, authenticated, PUBLIC;
GRANT SELECT (id, full_name, username, profile_photo_url, bio, writing_frequency,
              stories_read_count, stories_written_count, tags_used, created_at, updated_at)
  ON TABLE public.profiles TO authenticated;
GRANT INSERT (id, full_name, username, profile_photo_url, bio, writing_frequency, tags_used, updated_at)
  ON TABLE public.profiles TO authenticated;
GRANT UPDATE (full_name, username, profile_photo_url, bio, writing_frequency, tags_used, updated_at)
  ON TABLE public.profiles TO authenticated;
GRANT DELETE ON TABLE public.profiles TO authenticated;
REVOKE ALL ON FUNCTION public.get_dual_table_website_analytics(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dual_table_website_analytics(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_website_engagement_stats(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_website_engagement_stats(text) TO service_role;
REVOKE ALL ON FUNCTION public.get_website_visit_count() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_website_visit_count() TO service_role;
REVOKE ALL ON FUNCTION public.get_visit_statistics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_visit_statistics() TO service_role;
NOTIFY pgrst, 'reload schema';
