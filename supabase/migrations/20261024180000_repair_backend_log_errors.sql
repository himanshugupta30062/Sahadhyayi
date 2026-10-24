-- Repair production backend errors observed in Supabase logs (2026-10-24).
-- Safe to re-run: the profile policy, view, column and grants are idempotent.

CREATE OR REPLACE FUNCTION internal_security.viewer_location_sharing_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles AS viewer
    WHERE viewer.id = auth.uid() AND viewer.location_sharing IS TRUE
  );
$function$;
REVOKE ALL ON FUNCTION internal_security.viewer_location_sharing_enabled() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION internal_security.viewer_location_sharing_enabled() TO authenticated;

DROP POLICY IF EXISTS "Users and mutually consenting friends can view profiles" ON public.profiles;
CREATE POLICY "Users and mutually consenting friends can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (
    location_sharing IS TRUE
    AND internal_security.has_location_consent(id)
    AND internal_security.viewer_location_sharing_enabled()
    AND internal_security.has_location_consent((SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.friends AS f
      WHERE (f.user1_id = (SELECT auth.uid()) AND f.user2_id = profiles.id)
         OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = profiles.id)
    )
  )
);

GRANT SELECT (
  id, full_name, username, profile_photo_url, bio, writing_frequency,
  stories_written_count, stories_read_count, tags_used, created_at, updated_at
) ON public.profiles TO authenticated;

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT id, full_name, username, profile_photo_url, bio, writing_frequency,
       stories_read_count, stories_written_count, created_at
FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
COMMENT ON VIEW public.public_profiles IS
  'Limited reader profile fields for community display; excludes private location and presence fields';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Admin and service-only detailed analytics.
DO $migration$
DECLARE
  v_definition text;
  v_old text;
  v_new text;
BEGIN
  v_definition := pg_get_functiondef('public.get_dual_table_website_analytics(text)'::regprocedure);
  IF position('Access denied: Admin privileges required' IN v_definition) = 0 THEN
    v_old := 'BEGIN' || chr(10) || '  IF v_tf NOT IN';
    v_new := 'BEGIN' || chr(10) ||
      '  IF auth.role() <> ''service_role'' AND (auth.uid() IS NULL OR NOT public.is_admin()) THEN' || chr(10) ||
      '    RAISE EXCEPTION ''Access denied: Admin privileges required'';' || chr(10) ||
      '  END IF;' || chr(10) || '  IF v_tf NOT IN';
    IF position(v_old IN v_definition) = 0 THEN
      RAISE EXCEPTION 'Unexpected get_dual_table_website_analytics definition; refusing unsafe rewrite';
    END IF;
    EXECUTE replace(v_definition, v_old, v_new);
  END IF;
  ALTER FUNCTION public.get_dual_table_website_analytics(text) SET search_path = '';
  REVOKE ALL ON FUNCTION public.get_dual_table_website_analytics(text) FROM PUBLIC, anon;
  GRANT EXECUTE ON FUNCTION public.get_dual_table_website_analytics(text) TO authenticated, service_role;

  v_definition := pg_get_functiondef('public.get_website_engagement_stats(text)'::regprocedure);
  IF position('Access denied: Admin privileges required' IN v_definition) = 0 THEN
    v_old := 'BEGIN' || chr(10) || '  IF lower(coalesce(p_timeframe';
    v_new := 'BEGIN' || chr(10) ||
      '  IF auth.role() <> ''service_role'' AND (auth.uid() IS NULL OR NOT public.is_admin()) THEN' || chr(10) ||
      '    RAISE EXCEPTION ''Access denied: Admin privileges required'';' || chr(10) ||
      '  END IF;' || chr(10) || '  IF lower(coalesce(p_timeframe';
    IF position(v_old IN v_definition) = 0 THEN
      RAISE EXCEPTION 'Unexpected get_website_engagement_stats definition; refusing unsafe rewrite';
    END IF;
    EXECUTE replace(v_definition, v_old, v_new);
  END IF;
  REVOKE ALL ON FUNCTION public.get_website_engagement_stats(text) FROM PUBLIC, anon;
  GRANT EXECUTE ON FUNCTION public.get_website_engagement_stats(text) TO authenticated, service_role;

  REVOKE ALL ON FUNCTION public.get_website_visit_count() FROM PUBLIC, anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.get_website_visit_count() TO service_role;
END
$migration$;

-- Aggregate-only public counts are exposed via get_public_group_member_counts().
REVOKE SELECT ON public.group_chat_members FROM anon;
NOTIFY pgrst, 'reload schema';
