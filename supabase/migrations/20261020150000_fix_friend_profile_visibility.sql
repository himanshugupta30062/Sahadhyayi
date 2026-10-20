-- Return safe profile fields for the current user's social relationships.
-- Do not broaden direct profiles SELECT RLS: that policy also protects precise location data.
CREATE OR REPLACE FUNCTION public.get_profiles_for_social_context(profile_ids uuid[])
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  bio text,
  profile_photo_url text,
  location_lat numeric,
  location_lng numeric,
  location_sharing boolean,
  last_seen timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.bio,
    p.profile_photo_url,
    CASE
      WHEN is_friend AND p.location_sharing IS TRUE AND viewer.location_sharing IS TRUE
      THEN p.location_lat
      ELSE NULL
    END AS location_lat,
    CASE
      WHEN is_friend AND p.location_sharing IS TRUE AND viewer.location_sharing IS TRUE
      THEN p.location_lng
      ELSE NULL
    END AS location_lng,
    COALESCE(p.location_sharing, false) AS location_sharing,
    CASE
      WHEN is_friend AND p.location_sharing IS TRUE AND viewer.location_sharing IS TRUE
      THEN p.last_seen
      ELSE NULL
    END AS last_seen
  FROM public.profiles p
  LEFT JOIN public.profiles viewer ON viewer.id = auth.uid()
  CROSS JOIN LATERAL (
    SELECT EXISTS (
      SELECT 1
      FROM public.friends f
      WHERE (f.user1_id = auth.uid() AND f.user2_id = p.id)
         OR (f.user2_id = auth.uid() AND f.user1_id = p.id)
    ) AS is_friend
  ) relationship
  WHERE auth.uid() IS NOT NULL
    AND p.id = ANY(COALESCE(profile_ids, ARRAY[]::uuid[]))
    AND (
      p.id = auth.uid()
      OR relationship.is_friend
      OR EXISTS (
        SELECT 1
        FROM public.friend_requests fr
        WHERE fr.status = 'pending'
          AND (
            (fr.requester_id = auth.uid() AND fr.addressee_id = p.id)
            OR (fr.addressee_id = auth.uid() AND fr.requester_id = p.id)
          )
      )
    );
$function$;

REVOKE ALL ON FUNCTION public.get_profiles_for_social_context(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profiles_for_social_context(uuid[]) TO authenticated;

COMMENT ON FUNCTION public.get_profiles_for_social_context(uuid[]) IS
  'Returns basic profile fields only for the caller, mutual friends, or pending friend-request participants. Precise location and last-seen data require mutual location sharing.';
