-- Expose only coarse, consent-gated reader coordinates for map pins.
-- Coordinates are rounded to 2 decimal places (roughly kilometre-scale), never returned exactly.
DROP FUNCTION IF EXISTS public.get_nearby_book_readers(uuid, numeric);

CREATE FUNCTION public.get_nearby_book_readers(
  book_uuid uuid,
  radius_km numeric DEFAULT 5
)
RETURNS TABLE(
  reader_id uuid,
  reader_name text,
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
