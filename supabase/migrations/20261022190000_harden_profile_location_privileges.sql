-- Security hardening: do not expose private profile fields through direct PostgREST reads.
-- Social profile discovery continues through public_profiles and the consent-aware RPCs.

REVOKE SELECT ON TABLE public.profiles FROM anon, authenticated;

GRANT SELECT (
  id,
  full_name,
  username,
  profile_photo_url,
  bio,
  location,
  writing_frequency,
  stories_read_count,
  stories_written_count,
  tags_used,
  created_at,
  updated_at
) ON TABLE public.profiles TO authenticated, anon;

-- Anonymous profile discovery is served by the deliberately limited view, not the base table.
REVOKE SELECT ON TABLE public.profiles FROM PUBLIC;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  id,
  full_name,
  username,
  profile_photo_url,
  bio,
  location,
  writing_frequency,
  stories_read_count,
  stories_written_count,
  tags_used,
  created_at
FROM public.profiles;

REVOKE ALL ON TABLE public.public_profiles FROM PUBLIC;
GRANT SELECT ON TABLE public.public_profiles TO anon, authenticated;

-- Return private profile fields only to the authenticated owner.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT to_jsonb(p)
  FROM public.profiles AS p
  WHERE p.id = auth.uid()
    AND auth.uid() IS NOT NULL
$function$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Existing friend-location RPC remains the only intended cross-user coordinate path.
-- Keep it authenticated-only; its implementation must enforce friendship and consent.
REVOKE ALL ON FUNCTION public.get_friend_locations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_friend_locations() TO authenticated;

-- Prevent stale coordinates remaining for users who have disabled sharing.
UPDATE public.profiles
SET location_lat = NULL,
    location_lng = NULL
WHERE location_sharing IS NOT TRUE
  AND (location_lat IS NOT NULL OR location_lng IS NOT NULL);

NOTIFY pgrst, 'reload schema';
