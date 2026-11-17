-- Require explicit bilateral consent for every direct read of legacy user locations.
-- Also revoke stale location data whenever a user withdraws consent.

DROP POLICY IF EXISTS "Friends can view locations with mutual consent" ON public.user_locations;

CREATE POLICY "Friends can view locations with bilateral consent"
ON public.user_locations
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (
    auth.uid() IS NOT NULL
    AND internal_security.has_location_consent(user_id)
    AND internal_security.has_location_consent((SELECT auth.uid()))
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS owner
      WHERE owner.id = user_locations.user_id
        AND owner.location_sharing IS TRUE
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS viewer
      WHERE viewer.id = (SELECT auth.uid())
        AND viewer.location_sharing IS TRUE
    )
    AND EXISTS (
      SELECT 1
      FROM public.friends AS f
      WHERE
        (f.user1_id = (SELECT auth.uid()) AND f.user2_id = user_locations.user_id)
        OR
        (f.user2_id = (SELECT auth.uid()) AND f.user1_id = user_locations.user_id)
    )
  )
);

-- The table is a legacy client-readable surface; never expose it to anonymous callers.
REVOKE SELECT ON TABLE public.user_locations FROM anon;
GRANT SELECT ON TABLE public.user_locations TO authenticated;

-- Keep the stored location state consistent even if consent is revoked directly
-- (rather than through disable_my_location_sharing()).
CREATE OR REPLACE FUNCTION public.clear_location_data_after_consent_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSIF NEW.consented_at IS NULL THEN
    v_user_id := NEW.user_id;
  ELSE
    RETURN NEW;
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
      latitude = NULL,
      longitude = NULL,
      last_updated = now()
  WHERE user_id = v_user_id;

  DELETE FROM public.user_books_location
  WHERE user_id = v_user_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.clear_location_data_after_consent_withdrawal()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_clear_location_data_after_consent_withdrawal
ON public.location_sharing_consent;

CREATE TRIGGER trg_clear_location_data_after_consent_withdrawal
AFTER DELETE OR UPDATE OF consented_at
ON public.location_sharing_consent
FOR EACH ROW
EXECUTE FUNCTION public.clear_location_data_after_consent_withdrawal();

-- One-time cleanup for legacy rows that remain active without recorded consent.
UPDATE public.user_locations AS ul
SET is_active = false,
    latitude = NULL,
    longitude = NULL,
    last_updated = now()
WHERE ul.is_active IS TRUE
  AND NOT internal_security.has_location_consent(ul.user_id);

UPDATE public.profiles AS p
SET location_sharing = false,
    location_lat = NULL,
    location_lng = NULL,
    last_seen = NULL,
    updated_at = now()
WHERE p.location_sharing IS TRUE
  AND NOT internal_security.has_location_consent(p.id);

DELETE FROM public.user_books_location AS ubl
WHERE NOT internal_security.has_location_consent(ubl.user_id);

NOTIFY pgrst, 'reload schema';
