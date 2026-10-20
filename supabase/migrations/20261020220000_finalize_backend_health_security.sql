
-- Final backend health/security reconciliation for production.
-- These changes are intentionally non-destructive to application data.

-- The primary key already enforces uniqueness on website_visits.id.
ALTER TABLE public.website_visits DROP CONSTRAINT IF EXISTS website_visits_id_key;
DROP INDEX IF EXISTS public.website_visits_id_key;

-- Add indexes for public-table foreign keys that have no valid leading-column index.
DO $repair_fk_indexes$
DECLARE
  r record;
  idx_name text;
BEGIN
  FOR r IN
    SELECT
      con.conname,
      c.oid AS relid,
      n.nspname AS schema_name,
      c.relname AS table_name,
      array_agg(a.attnum::smallint ORDER BY k.ord) AS key_nums,
      string_agg(format('%I', a.attname), ', ' ORDER BY k.ord) AS columns_sql
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN unnest(con.conkey) WITH ORDINALITY k(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
    WHERE con.contype = 'f'
      AND n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = con.conrelid
          AND i.indisvalid AND i.indisready
          AND i.indnkeyatts >= cardinality(con.conkey)
          AND (
            SELECT array_agg(x ORDER BY ordinality)::smallint[]
            FROM unnest(i.indkey::smallint[]) WITH ORDINALITY z(x, ordinality)
            WHERE ordinality <= cardinality(con.conkey)
          ) = con.conkey
      )
    GROUP BY con.conname, c.oid, n.nspname, c.relname
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = r.relid
        AND i.indisvalid AND i.indisready
        AND i.indnkeyatts >= cardinality(r.key_nums)
        AND (
          SELECT array_agg(x ORDER BY ordinality)::smallint[]
          FROM unnest(i.indkey::smallint[]) WITH ORDINALITY z(x, ordinality)
          WHERE ordinality <= cardinality(r.key_nums)
        ) = r.key_nums
    ) THEN
      idx_name := left('idx_fk_' || r.table_name || '_' || substr(md5(r.conname), 1, 8), 63);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)',
        idx_name, r.schema_name, r.table_name, r.columns_sql);
    END IF;
  END LOOP;
END
$repair_fk_indexes$;

-- Hidden helper schema for privileged, narrow lookups used by views and RLS.
CREATE SCHEMA IF NOT EXISTS internal_security;
REVOKE ALL ON SCHEMA internal_security FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA internal_security TO authenticated, service_role;

CREATE OR REPLACE FUNCTION internal_security.has_location_consent(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.location_sharing_consent AS lsc
    WHERE lsc.user_id = user_uuid
      AND lsc.consented_at IS NOT NULL
  );
$function$;
REVOKE ALL ON FUNCTION internal_security.has_location_consent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION internal_security.has_location_consent(uuid) TO authenticated, service_role;

-- Expose only chapter-safe spoiler content through a security-invoker view.
CREATE OR REPLACE FUNCTION public.user_chapter_progress(_user uuid, _book uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE(MAX(drp.chapter_number), 0)
  FROM public.detailed_reading_progress AS drp
  WHERE drp.user_id = auth.uid()
    AND drp.book_id = _book
    AND drp.completion_percentage >= 100;
$function$;

CREATE OR REPLACE FUNCTION internal_security.spoiler_threads_safe_rows()
RETURNS TABLE (
  id uuid,
  book_id uuid,
  user_id uuid,
  title text,
  min_chapter integer,
  created_at timestamptz,
  updated_at timestamptz,
  body text,
  is_unlocked boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    t.id, t.book_id, t.user_id, t.title, t.min_chapter, t.created_at, t.updated_at,
    CASE WHEN public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter
      THEN t.body ELSE NULL::text END AS body,
    (public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter) AS is_unlocked
  FROM public.spoiler_threads AS t
  WHERE auth.uid() IS NOT NULL;
$function$;
REVOKE ALL ON FUNCTION internal_security.spoiler_threads_safe_rows() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION internal_security.spoiler_threads_safe_rows() TO authenticated;

REVOKE SELECT ON public.spoiler_threads FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE VIEW public.spoiler_threads_safe
WITH (security_invoker = true)
AS
SELECT id, book_id, user_id, title, min_chapter, created_at, updated_at, body, is_unlocked
FROM internal_security.spoiler_threads_safe_rows();
GRANT SELECT ON public.spoiler_threads_safe TO authenticated;

-- Consent lookups exposed through public RPC can only disclose the caller's own setting.
CREATE OR REPLACE FUNCTION public.has_location_consent(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND user_uuid = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.location_sharing_consent AS lsc
      WHERE lsc.user_id = auth.uid() AND lsc.consented_at IS NOT NULL
    );
$function$;
REVOKE ALL ON FUNCTION public.has_location_consent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_location_consent(uuid) TO authenticated, service_role;

-- Keep profile lookup scoped to self/friends/pending requests and hide precise location unless
-- both parties enabled location sharing and explicitly recorded consent.
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
SET search_path = ''
AS $function$
  SELECT
    p.id, p.username, p.full_name, p.bio, p.profile_photo_url,
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

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users and mutually consenting friends can view profiles" ON public.profiles;
CREATE POLICY "Users and mutually consenting friends can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (
      location_sharing IS TRUE
      AND internal_security.has_location_consent(id)
      AND EXISTS (
        SELECT 1 FROM public.profiles AS viewer
        WHERE viewer.id = (SELECT auth.uid()) AND viewer.location_sharing IS TRUE
      )
      AND internal_security.has_location_consent((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1 FROM public.friends AS f
        WHERE (f.user1_id = (SELECT auth.uid()) AND f.user2_id = profiles.id)
           OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = profiles.id)
      )
    )
  );

-- The legacy boolean helper may only disclose consent for the current user.
CREATE OR REPLACE FUNCTION public.get_friend_profile_info(friend_user_id uuid)
RETURNS TABLE (
  id uuid, name text, username text, bio text,
  profile_picture_url text, location text, joined_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_is_self boolean := auth.uid() = friend_user_id;
  v_are_friends boolean := false;
  v_pending_request boolean := false;
  v_mutual_location_consent boolean := false;
BEGIN
  IF auth.uid() IS NULL OR friend_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.friends AS f
    WHERE (f.user1_id = auth.uid() AND f.user2_id = friend_user_id)
       OR (f.user2_id = auth.uid() AND f.user1_id = friend_user_id)
  ) INTO v_are_friends;

  SELECT EXISTS (
    SELECT 1 FROM public.friend_requests AS fr
    WHERE fr.status = 'pending'
      AND (
        (fr.requester_id = auth.uid() AND fr.addressee_id = friend_user_id)
        OR (fr.addressee_id = auth.uid() AND fr.requester_id = friend_user_id)
      )
  ) INTO v_pending_request;

  IF NOT v_is_self AND NOT v_are_friends AND NOT v_pending_request THEN
    RETURN;
  END IF;

  SELECT
    EXISTS (SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.location_sharing IS TRUE)
    AND EXISTS (SELECT 1 FROM public.profiles AS p
      WHERE p.id = friend_user_id AND p.location_sharing IS TRUE)
    AND internal_security.has_location_consent(auth.uid())
    AND internal_security.has_location_consent(friend_user_id)
  INTO v_mutual_location_consent;

  RETURN QUERY
  SELECT
    up.id, up.name, up.username,
    CASE WHEN v_is_self OR v_are_friends THEN up.bio ELSE LEFT(COALESCE(up.bio, ''), 100) END,
    up.profile_picture_url,
    CASE WHEN v_is_self OR (v_are_friends AND v_mutual_location_consent)
      THEN up.location ELSE NULL::text END,
    up.joined_at
  FROM public.user_profile AS up
  WHERE up.id = friend_user_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.get_friend_profile_info(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_friend_profile_info(uuid) TO authenticated;

-- Nearby readers require the caller and each returned friend to have explicit consent.
CREATE OR REPLACE FUNCTION public.get_nearby_readers(radius_km numeric DEFAULT 10)
RETURNS TABLE(reader_id uuid, reader_name text, book_title text, distance_km numeric, is_friend boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_lat numeric;
  user_lng numeric;
  v_radius numeric;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  v_radius := LEAST(GREATEST(COALESCE(radius_km, 0), 0), 100);
  IF v_radius <= 0 OR NOT internal_security.has_location_consent(auth.uid()) THEN RETURN; END IF;

  SELECT p.location_lat, p.location_lng INTO user_lat, user_lng
  FROM public.profiles AS p WHERE p.id = auth.uid() AND p.location_sharing IS TRUE;
  IF user_lat IS NULL OR user_lng IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT r.user_id, r.name, r.book, calc.distance_km, true
  FROM public.readers AS r
  JOIN public.friends AS f ON (
    (f.user1_id = auth.uid() AND f.user2_id = r.user_id)
    OR (f.user2_id = auth.uid() AND f.user1_id = r.user_id)
  )
  JOIN public.profiles AS p ON p.id = r.user_id
  CROSS JOIN LATERAL (
    SELECT (6371 * acos(LEAST(1::double precision, GREATEST(-1::double precision,
      cos(radians(user_lat::double precision)) * cos(radians(r.lat::double precision)) *
      cos(radians(r.lng::double precision) - radians(user_lng::double precision)) +
      sin(radians(user_lat::double precision)) * sin(radians(r.lat::double precision))
    ))))::numeric AS distance_km
  ) AS calc
  WHERE p.location_sharing IS TRUE
    AND internal_security.has_location_consent(r.user_id)
    AND r.user_id <> auth.uid()
    AND calc.distance_km <= v_radius
  ORDER BY calc.distance_km;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.get_nearby_readers(numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_nearby_book_readers(book_uuid uuid, radius_km numeric DEFAULT 5)
RETURNS TABLE(reader_id uuid, reader_name text, distance_km numeric, reading_since timestamptz, is_friend boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
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
  FROM public.profiles AS p WHERE p.id = auth.uid() AND p.location_sharing IS TRUE;
  IF user_lat IS NULL OR user_lng IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT ubl.user_id, p.full_name, calc.distance_km, ubl.created_at, true
  FROM public.user_books_location AS ubl
  JOIN public.friends AS f ON (
    (f.user1_id = auth.uid() AND f.user2_id = ubl.user_id)
    OR (f.user2_id = auth.uid() AND f.user1_id = ubl.user_id)
  )
  JOIN public.profiles AS p ON p.id = ubl.user_id
  CROSS JOIN LATERAL (
    SELECT (6371 * acos(LEAST(1::double precision, GREATEST(-1::double precision,
      cos(radians(user_lat::double precision)) * cos(radians(ubl.latitude::double precision)) *
      cos(radians(ubl.longitude::double precision) - radians(user_lng::double precision)) +
      sin(radians(user_lat::double precision)) * sin(radians(ubl.latitude::double precision))
    ))))::numeric AS distance_km
  ) AS calc
  WHERE ubl.book_id = book_uuid
    AND p.location_sharing IS TRUE
    AND internal_security.has_location_consent(ubl.user_id)
    AND ubl.user_id <> auth.uid()
    AND calc.distance_km <= v_radius
  ORDER BY calc.distance_km;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.get_nearby_book_readers(uuid, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_friend_locations()
RETURNS TABLE(id uuid, full_name text, location_lat numeric, location_lng numeric)
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
     ) THEN RETURN; END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.location_lat, p.location_lng
  FROM public.profiles AS p
  JOIN public.friends AS f ON (
    (f.user1_id = auth.uid() AND f.user2_id = p.id)
    OR (f.user2_id = auth.uid() AND f.user1_id = p.id)
  )
  WHERE p.location_sharing IS TRUE
    AND internal_security.has_location_consent(p.id)
    AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
    AND p.id <> auth.uid();
END;
$function$;
GRANT EXECUTE ON FUNCTION public.get_friend_locations() TO authenticated;

CREATE OR REPLACE FUNCTION public.share_book_location(book_uuid uuid, lat double precision, lng double precision)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  location_id uuid;
  sharing_enabled boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF lat IS NULL OR lng IS NULL OR lat < -90 OR lat > 90 OR lng < -180 OR lng > 180 THEN
    RAISE EXCEPTION 'Invalid latitude or longitude';
  END IF;
  IF NOT internal_security.has_location_consent(auth.uid()) THEN
    RAISE EXCEPTION 'Location sharing consent required. Please enable location sharing in your settings.';
  END IF;
  SELECT p.location_sharing IS TRUE INTO sharing_enabled
  FROM public.profiles AS p WHERE p.id = auth.uid();
  IF COALESCE(sharing_enabled, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Enable location sharing before sharing a book location';
  END IF;

  INSERT INTO public.user_books_location (user_id, book_id, latitude, longitude)
  VALUES (auth.uid(), book_uuid, lat, lng)
  ON CONFLICT (user_id, book_id) DO UPDATE
    SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, updated_at = now()
  RETURNING id INTO location_id;
  RETURN location_id;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.share_book_location(uuid, double precision, double precision) TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view shared reading locations" ON public.readers;
DROP POLICY IF EXISTS "Users can view location from friends only" ON public.readers;
DROP POLICY IF EXISTS "Friends with consent can view locations" ON public.readers;
CREATE POLICY "Friends with consent can view locations" ON public.readers
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (
      internal_security.has_location_consent(user_id)
      AND internal_security.has_location_consent((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1 FROM public.friends AS f
        WHERE (f.user1_id = (SELECT auth.uid()) AND f.user2_id = readers.user_id)
           OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = readers.user_id)
      )
      AND EXISTS (SELECT 1 FROM public.profiles AS p
        WHERE p.id = readers.user_id AND p.location_sharing IS TRUE)
      AND EXISTS (SELECT 1 FROM public.profiles AS p
        WHERE p.id = (SELECT auth.uid()) AND p.location_sharing IS TRUE)
    )
  );

DROP POLICY IF EXISTS "Friends can view book locations with consent" ON public.user_books_location;
CREATE POLICY "Friends can view book locations with consent" ON public.user_books_location
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (
      internal_security.has_location_consent(user_id)
      AND internal_security.has_location_consent((SELECT auth.uid()))
      AND EXISTS (SELECT 1 FROM public.profiles AS viewer
        WHERE viewer.id = (SELECT auth.uid()) AND viewer.location_sharing IS TRUE)
      AND EXISTS (SELECT 1 FROM public.profiles AS owner
        WHERE owner.id = user_books_location.user_id AND owner.location_sharing IS TRUE)
      AND EXISTS (
        SELECT 1 FROM public.friends AS f
        WHERE (f.user1_id = (SELECT auth.uid()) AND f.user2_id = user_books_location.user_id)
           OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = user_books_location.user_id)
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert their own location data" ON public.user_books_location;
CREATE POLICY "Users can insert their own location data" ON public.user_books_location
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND internal_security.has_location_consent((SELECT auth.uid()))
    AND latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180
    AND EXISTS (SELECT 1 FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid()) AND p.location_sharing IS TRUE)
  );

DROP POLICY IF EXISTS "Users can update their own location data" ON public.user_books_location;
CREATE POLICY "Users can update their own location data" ON public.user_books_location
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND internal_security.has_location_consent((SELECT auth.uid()))
    AND latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180
    AND EXISTS (SELECT 1 FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid()) AND p.location_sharing IS TRUE)
  );

-- Admin-only visitor analytics functions must not rely on anonymous username strings.
CREATE OR REPLACE FUNCTION public.get_contact_messages_admin()
RETURNS TABLE(id uuid, name text, email text, message text, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  RETURN QUERY
  SELECT cm.id, cm.name, cm.email, cm.message, cm.created_at
  FROM public.contact_messages AS cm
  ORDER BY cm.created_at DESC;
END;
$function$;
REVOKE ALL ON FUNCTION public.get_contact_messages_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_contact_messages_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_top_visitor_countries(limit_count integer DEFAULT 15)
RETURNS TABLE(country_code text, visit_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  RETURN QUERY
  SELECT wv.country_code, count(*)::bigint
  FROM public.website_visits AS wv
  WHERE wv.country_code IS NOT NULL
    AND wv.country_code <> 'LOCAL'
    AND wv.country_code <> ''
  GROUP BY wv.country_code
  ORDER BY count(*) DESC
  LIMIT LEAST(GREATEST(COALESCE(limit_count, 15), 1), 50);
END;
$function$;
REVOKE ALL ON FUNCTION public.get_top_visitor_countries(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_top_visitor_countries(integer) TO authenticated;

-- Relationship and role helpers may answer only for the signed-in user's own identity.
CREATE OR REPLACE FUNCTION public.are_friends(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND ($1 = auth.uid() OR $2 = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.friends AS f
      WHERE (f.user1_id = $1 AND f.user2_id = $2)
         OR (f.user2_id = $1 AND f.user1_id = $2)
    );
$function$;
REVOKE ALL ON FUNCTION public.are_friends(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_friends(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT auth.uid() IS NOT NULL AND _user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.group_chat_members AS gcm
      WHERE gcm.group_id = _group_id AND gcm.user_id = auth.uid() AND gcm.role = 'admin');
$function$;
REVOKE ALL ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_group_creator(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT auth.uid() IS NOT NULL AND _user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.group_chats AS gc
      WHERE gc.id = _group_id AND gc.created_by = auth.uid());
$function$;
REVOKE ALL ON FUNCTION public.is_group_creator(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT auth.uid() IS NOT NULL AND _user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.group_chat_members AS gcm
      WHERE gcm.group_id = _group_id AND gcm.user_id = auth.uid());
$function$;
REVOKE ALL ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT auth.uid() IS NOT NULL AND _user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles AS ur
      WHERE ur.user_id = auth.uid() AND ur.role = _role);
$function$;
REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;

-- Direct public RPCs that could write user-supplied IP/user-agent analytics were retired.
REVOKE ALL ON FUNCTION public.record_pageview(text, text, text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_pageview(text, text, text, text, text, text, text, text)
  TO service_role;
REVOKE ALL ON FUNCTION public.record_website_visit(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_website_visit(text, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.record_website_visit(inet, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_website_visit(inet, text, text, text) TO service_role;

-- Welcome email dispatch is asynchronous; enqueue failure never blocks Auth/profile creation.
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_email text;
  v_name text;
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U';
BEGIN
  SELECT u.email,
    COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')
  INTO v_email, v_name
  FROM auth.users AS u
  WHERE u.id = NEW.id;

  IF v_email IS NULL OR btrim(v_email) = '' THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://rknxtatvlzunatpyqxro.supabase.co/functions/v1/send-welcome-email',
      body := jsonb_build_object(
        'email', v_email,
        'name', COALESCE(NEW.full_name, v_name, 'Reader'),
        'user_id', NEW.id
      ),
      headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key),
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Welcome email enqueue failed for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_send_welcome_email ON public.profiles;
CREATE TRIGGER trg_send_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.send_welcome_email_on_signup();

NOTIFY pgrst, 'reload schema';
