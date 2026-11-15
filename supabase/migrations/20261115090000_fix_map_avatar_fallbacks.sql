-- Keep the map avatar field populated for readers who have not created a
-- custom Bitmoji yet. The custom avatar remains preferred; profile photos are
-- the fallback. All original relationship and mutual-consent predicates remain
-- unchanged so this does not broaden map/location visibility.

CREATE OR REPLACE FUNCTION public.get_profiles_for_social_context(profile_ids uuid[])
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  bio text,
  profile_photo_url text,
  avatar_img_url text,
  location_lat numeric,
  location_lng numeric,
  location_sharing boolean,
  last_seen timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.bio,
    p.profile_photo_url,
    COALESCE(ua.avatar_img_url, p.profile_photo_url) AS avatar_img_url,
    CASE WHEN relationship.is_friend
      AND p.location_sharing IS TRUE AND viewer.location_sharing IS TRUE
      AND internal_security.has_location_consent(p.id)
      AND internal_security.has_location_consent(auth.uid())
      THEN p.location_lat ELSE NULL END AS location_lat,
    CASE WHEN relationship.is_friend
      AND p.location_sharing IS TRUE AND viewer.location_sharing IS TRUE
      AND internal_security.has_location_consent(p.id)
      AND internal_security.has_location_consent(auth.uid())
      THEN p.location_lng ELSE NULL END AS location_lng,
    COALESCE(p.location_sharing, false) AS location_sharing,
    CASE WHEN relationship.is_friend
      AND p.location_sharing IS TRUE AND viewer.location_sharing IS TRUE
      AND internal_security.has_location_consent(p.id)
      AND internal_security.has_location_consent(auth.uid())
      THEN p.last_seen ELSE NULL END AS last_seen
  FROM public.profiles AS p
  LEFT JOIN public.user_avatars AS ua ON ua.user_id = p.id
  LEFT JOIN public.profiles AS viewer ON viewer.id = auth.uid()
  CROSS JOIN LATERAL (
    SELECT EXISTS (
      SELECT 1 FROM public.friends AS f
      WHERE (f.user1_id = auth.uid() AND f.user2_id = p.id)
         OR (f.user2_id = auth.uid() AND f.user1_id = p.id)
    ) AS is_friend
  ) AS relationship
  WHERE auth.uid() IS NOT NULL
    AND p.id = ANY(COALESCE(profile_ids, ARRAY[]::uuid[]))
    AND (
      p.id = auth.uid()
      OR relationship.is_friend
      OR EXISTS (
        SELECT 1 FROM public.friend_requests AS fr
        WHERE fr.status = 'pending'
          AND (
            (fr.requester_id = auth.uid() AND fr.addressee_id = p.id)
            OR (fr.addressee_id = auth.uid() AND fr.requester_id = p.id)
          )
      )
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_nearby_book_readers(
  book_uuid uuid,
  radius_km numeric DEFAULT 5
)
RETURNS TABLE(
  reader_id uuid,
  reader_name text,
  avatar_img_url text,
  approximate_latitude numeric,
  approximate_longitude numeric,
  distance_km numeric,
  reading_since timestamptz,
  is_friend boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_lat numeric;
  user_lng numeric;
  v_radius numeric;
BEGIN
  IF auth.uid() IS NULL OR book_uuid IS NULL THEN RETURN; END IF;
  v_radius := LEAST(GREATEST(COALESCE(radius_km, 0), 0), 100);
  IF v_radius <= 0 OR NOT internal_security.has_location_consent(auth.uid()) THEN RETURN; END IF;

  SELECT p.location_lat, p.location_lng INTO user_lat, user_lng
  FROM public.profiles AS p
  WHERE p.id = auth.uid() AND p.location_sharing IS TRUE;

  IF user_lat IS NULL OR user_lng IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    ubl.user_id,
    p.full_name,
    COALESCE(ua.avatar_img_url, p.profile_photo_url) AS avatar_img_url,
    round(ubl.latitude::numeric, 2) AS approximate_latitude,
    round(ubl.longitude::numeric, 2) AS approximate_longitude,
    calc.distance_km,
    ubl.created_at,
    true
  FROM public.user_books_location AS ubl
  JOIN public.friends AS f ON (
    (f.user1_id = auth.uid() AND f.user2_id = ubl.user_id)
    OR (f.user2_id = auth.uid() AND f.user1_id = ubl.user_id)
  )
  JOIN public.profiles AS p ON p.id = ubl.user_id
  LEFT JOIN public.user_avatars AS ua ON ua.user_id = ubl.user_id
  CROSS JOIN LATERAL (
    SELECT (6371 * acos(
      LEAST(1::double precision, GREATEST(-1::double precision,
        cos(radians(user_lat::double precision)) * cos(radians(ubl.latitude::double precision)) *
        cos(radians(ubl.longitude::double precision) - radians(user_lng::double precision)) +
        sin(radians(user_lat::double precision)) * sin(radians(ubl.latitude::double precision))
      ))
    ))::numeric AS distance_km
  ) AS calc
  WHERE ubl.book_id = book_uuid
    AND p.location_sharing IS TRUE
    AND internal_security.has_location_consent(ubl.user_id)
    AND ubl.user_id <> auth.uid()
    AND calc.distance_km <= v_radius
  ORDER BY calc.distance_km;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_friend_locations()
RETURNS TABLE(
  id uuid,
  full_name text,
  location_lat numeric,
  location_lng numeric,
  avatar_img_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.uid() IS NULL
     OR NOT internal_security.has_location_consent(auth.uid())
     OR NOT EXISTS (
       SELECT 1 FROM public.profiles AS requester
       WHERE requester.id = auth.uid() AND requester.location_sharing IS TRUE
     ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.location_lat, p.location_lng, COALESCE(ua.avatar_img_url, p.profile_photo_url) AS avatar_img_url
  FROM public.profiles AS p
  JOIN public.friends AS f ON (
    (f.user1_id = auth.uid() AND f.user2_id = p.id)
    OR (f.user2_id = auth.uid() AND f.user1_id = p.id)
  )
  LEFT JOIN public.user_avatars AS ua ON ua.user_id = p.id
  WHERE p.location_sharing IS TRUE
    AND internal_security.has_location_consent(p.id)
    AND p.location_lat IS NOT NULL
    AND p.location_lng IS NOT NULL
    AND p.id <> auth.uid();
END;
$function$;

NOTIFY pgrst, 'reload schema';
