
ALTER POLICY "Friends with consent can view locations" ON public.readers
  USING (
    user_id = (SELECT auth.uid())
    OR (
      internal_security.has_location_consent(user_id)
      AND internal_security.has_location_consent((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1 FROM public.friends f
        WHERE (f.user1_id = (SELECT auth.uid()) AND f.user2_id = readers.user_id)
           OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = readers.user_id)
      )
      AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = readers.user_id AND p.location_sharing IS TRUE)
      AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.location_sharing IS TRUE)
    )
  );
REVOKE ALL ON FUNCTION public.has_location_consent(uuid) FROM PUBLIC, anon, authenticated;
