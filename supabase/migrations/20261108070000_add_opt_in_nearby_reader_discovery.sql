-- Let readers opt in to book-based local discovery without changing the
-- existing friend-only live location sharing permission.
CREATE TABLE IF NOT EXISTS public.reader_discovery_locations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  consented_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reader_discovery_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Readers manage their own discovery location" ON public.reader_discovery_locations;
CREATE POLICY "Readers manage their own discovery location"
  ON public.reader_discovery_locations
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.reader_discovery_locations FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reader_discovery_locations TO authenticated;

CREATE INDEX IF NOT EXISTS idx_user_bookshelf_reading_match
  ON public.user_bookshelf (book_id, status, user_id);

-- The precise coordinates remain in a self-readable table. This RPC only
-- returns profile details and a coarse distance band to mutually opted-in readers.
CREATE OR REPLACE FUNCTION public.get_nearby_reader_matches(
  book_uuid uuid,
  radius_km numeric DEFAULT 25
)
RETURNS TABLE (
  reader_id uuid,
  reader_name text,
  username text,
  profile_photo_url text,
  distance_band text,
  is_friend boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  viewer_lat double precision;
  viewer_lng double precision;
  viewer_radius numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF book_uuid IS NULL THEN
    RAISE EXCEPTION 'A book is required for nearby reader discovery';
  END IF;

  viewer_radius := LEAST(GREATEST(COALESCE(radius_km, 0), 0), 50);
  IF viewer_radius <= 0 THEN
    RETURN;
  END IF;

  SELECT location.latitude, location.longitude
  INTO viewer_lat, viewer_lng
  FROM public.reader_discovery_locations AS location
  WHERE location.user_id = auth.uid()
    AND location.consented_at IS NOT NULL;

  IF viewer_lat IS NULL OR viewer_lng IS NULL THEN
    RETURN;
  END IF;

  -- Discovery is book-specific: the requesting reader must also have the
  -- selected title marked as Currently Reading.
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_bookshelf AS own_shelf
    WHERE own_shelf.user_id = auth.uid()
      AND own_shelf.book_id = book_uuid
      AND own_shelf.status = 'reading'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    candidate.user_id AS reader_id,
    COALESCE(NULLIF(btrim(profile.full_name), ''), NULLIF(btrim(profile.username), ''), 'Reader') AS reader_name,
    profile.username,
    profile.profile_photo_url,
    CASE
      WHEN distance.distance_km <= 5 THEN 'Within 5 km'
      WHEN distance.distance_km <= 10 THEN '5–10 km away'
      WHEN distance.distance_km <= 25 THEN '10–25 km away'
      ELSE '25–50 km away'
    END AS distance_band,
    EXISTS (
      SELECT 1
      FROM public.friends AS friendship
      WHERE (friendship.user1_id = auth.uid() AND friendship.user2_id = candidate.user_id)
         OR (friendship.user2_id = auth.uid() AND friendship.user1_id = candidate.user_id)
    ) AS is_friend
  FROM public.reader_discovery_locations AS candidate
  JOIN public.user_bookshelf AS shelf
    ON shelf.user_id = candidate.user_id
   AND shelf.book_id = book_uuid
   AND shelf.status = 'reading'
  JOIN public.profiles AS profile
    ON profile.id = candidate.user_id
  CROSS JOIN LATERAL (
    SELECT (
      6371 * acos(
        LEAST(1::double precision, GREATEST(-1::double precision,
          cos(radians(viewer_lat)) * cos(radians(candidate.latitude)) *
          cos(radians(candidate.longitude) - radians(viewer_lng)) +
          sin(radians(viewer_lat)) * sin(radians(candidate.latitude))
        ))
      )
    )::numeric AS distance_km
  ) AS distance
  WHERE candidate.user_id <> auth.uid()
    AND candidate.consented_at IS NOT NULL
    AND distance.distance_km <= viewer_radius
    AND NOT EXISTS (
      SELECT 1
      FROM public.friend_requests AS request
      WHERE request.status::text = 'blocked'
        AND (
          (request.requester_id = auth.uid() AND request.addressee_id = candidate.user_id)
          OR (request.addressee_id = auth.uid() AND request.requester_id = candidate.user_id)
        )
    )
  ORDER BY distance.distance_km ASC, profile.full_name ASC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_nearby_reader_matches(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_nearby_reader_matches(uuid, numeric) TO authenticated;
