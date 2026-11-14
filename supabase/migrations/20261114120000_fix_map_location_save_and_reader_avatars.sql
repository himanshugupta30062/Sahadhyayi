-- Restore map location saves through narrow owner-scoped RPCs after direct profile
-- location-column access was intentionally revoked by the profile hardening migrations.
-- Avatars are returned only through the same authenticated social relationships that
-- already authorize a profile or consent-gated map location.

CREATE OR REPLACE FUNCTION public.record_location_consent(
  ip_addr inet DEFAULT NULL,
  user_agent_string text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.location_sharing_consent (user_id, ip_address, user_agent)
  VALUES (auth.uid(), ip_addr, user_agent_string)
  ON CONFLICT (user_id) DO UPDATE SET
    consented_at = now(),
    ip_address = EXCLUDED.ip_address,
    user_agent = EXCLUDED.user_agent;

  -- Consent is recorded separately. Sharing becomes active only after a valid
  -- location is successfully saved through save_my_location().
END;
$function$;

REVOKE ALL ON FUNCTION public.record_location_consent(inet, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_location_consent(inet, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_my_location(
  p_lat numeric,
  p_lng numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF p_lat IS NULL OR p_lng IS NULL
     OR p_lat < -90 OR p_lat > 90
     OR p_lng < -180 OR p_lng > 180
     OR (p_lat = 0 AND p_lng = 0) THEN
    RAISE EXCEPTION 'Valid latitude and longitude are required' USING ERRCODE = '22023';
  END IF;

  IF NOT internal_security.has_location_consent(v_user_id) THEN
    RAISE EXCEPTION 'Location sharing consent is required before saving coordinates' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET location_lat = round(p_lat, 7),
      location_lng = round(p_lng, 7),
      location_sharing = true,
      last_seen = now(),
      updated_at = now()
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Your reader profile is not ready yet. Refresh your profile and try again';
  END IF;

  -- Keep the legacy location row synchronized for older map surfaces.
  INSERT INTO public.user_locations (user_id, latitude, longitude, is_active, last_updated)
  VALUES (v_user_id, p_lat::double precision, p_lng::double precision, true, now())
  ON CONFLICT (user_id) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    is_active = true,
    last_updated = now();

  RETURN jsonb_build_object(
    'location_lat', round(p_lat, 7),
    'location_lng', round(p_lng, 7),
    'location_sharing', true
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.save_my_location(numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_my_location(numeric, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.disable_my_location_sharing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  UPDATE public.profiles
  SET location_sharing = false,
      location_lat = NULL,
      location_lng = NULL,
      last_seen = NULL,
      updated_at = now()
  WHERE id = v_user_id;

  UPDATE public.user_locations
  SET is_active = false,
      last_updated = now()
  WHERE user_id = v_user_id;

  -- Remove exact book-location rows and the consent grant when the reader opts out.
  DELETE FROM public.user_books_location WHERE user_id = v_user_id;
  DELETE FROM public.location_sharing_consent WHERE user_id = v_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.disable_my_location_sharing() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.disable_my_location_sharing() TO authenticated;

-- Include the avatar URL in the already relationship-scoped social profile response.
DROP FUNCTION IF EXISTS public.get_profiles_for_social_context(uuid[]);
CREATE FUNCTION public.get_profiles_for_social_context(profile_ids uuid[])
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
    ua.avatar_img_url,
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

REVOKE ALL ON FUNCTION public.get_profiles_for_social_context(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profiles_for_social_context(uuid[]) TO authenticated;

-- Nearby map results already include only mutually consenting friends and coarse
-- coordinates. Return their avatar alongside those same consent-gated results.
DROP FUNCTION IF EXISTS public.get_nearby_book_readers(uuid, numeric);
CREATE FUNCTION public.get_nearby_book_readers(
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
    ua.avatar_img_url,
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

REVOKE ALL ON FUNCTION public.get_nearby_book_readers(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_nearby_book_readers(uuid, numeric) TO authenticated, service_role;

-- The book-specific reader map also receives avatars, but only with the same
-- friend and mutual-location-consent checks that already authorize exact pins.
DROP FUNCTION IF EXISTS public.get_friend_locations();
CREATE FUNCTION public.get_friend_locations()
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
  SELECT p.id, p.full_name, p.location_lat, p.location_lng, ua.avatar_img_url
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

REVOKE ALL ON FUNCTION public.get_friend_locations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_friend_locations() TO authenticated;

NOTIFY pgrst, 'reload schema';
