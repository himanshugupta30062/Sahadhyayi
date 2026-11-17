-- Require explicit location consent for all client writes to legacy user_locations.
-- Keep owner deletion available so users can always remove their own location data.

DROP POLICY IF EXISTS "Users can insert their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update their own location" ON public.user_locations;

CREATE POLICY "Consented users can insert their own location"
ON public.user_locations
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND internal_security.has_location_consent((SELECT auth.uid()))
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.location_sharing IS TRUE
  )
  AND latitude BETWEEN -90 AND 90
  AND longitude BETWEEN -180 AND 180
);

CREATE POLICY "Consented users can update their own location"
ON public.user_locations
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  AND internal_security.has_location_consent((SELECT auth.uid()))
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.location_sharing IS TRUE
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND internal_security.has_location_consent((SELECT auth.uid()))
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.location_sharing IS TRUE
  )
  AND latitude BETWEEN -90 AND 90
  AND longitude BETWEEN -180 AND 180
);

REVOKE INSERT, UPDATE ON TABLE public.user_locations FROM anon;
GRANT INSERT, UPDATE ON TABLE public.user_locations TO authenticated;

NOTIFY pgrst, 'reload schema';
