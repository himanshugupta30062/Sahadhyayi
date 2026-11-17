-- Keep location-consent grants writable only through owner-scoped SECURITY DEFINER RPCs.
-- Direct table writes would let a client create a consent row without the consent flow.

DROP POLICY IF EXISTS "Users can view own consent" ON public.location_sharing_consent;

CREATE POLICY "Users can view own consent"
ON public.location_sharing_consent
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Consent is granted through record_location_consent() and withdrawn through
-- disable_my_location_sharing(). Both functions bind the affected user to auth.uid().
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.location_sharing_consent
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.location_sharing_consent TO authenticated;

NOTIFY pgrst, 'reload schema';
