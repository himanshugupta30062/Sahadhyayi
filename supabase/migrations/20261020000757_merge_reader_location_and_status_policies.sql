
ALTER POLICY "Friends with consent can view locations" ON public.readers
  USING (
    user_id = (SELECT auth.uid())
    OR (
      has_location_consent(user_id)
      AND has_location_consent((SELECT auth.uid()))
      AND EXISTS (
        SELECT 1 FROM public.friends f
        WHERE (f.user1_id = (SELECT auth.uid()) AND f.user2_id = readers.user_id)
           OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = readers.user_id)
      )
      AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = readers.user_id AND p.location_sharing IS TRUE)
      AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.location_sharing IS TRUE)
    )
  );
DROP POLICY "Users can view location from friends only" ON public.readers;

ALTER POLICY "Users can view friends statuses" ON public.user_status
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.friends f
      WHERE (f.user1_id = (SELECT auth.uid()) AND f.user2_id = user_status.user_id)
         OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = user_status.user_id)
    )
  );
DROP POLICY "Users can view their own status" ON public.user_status;
DROP POLICY "Users can update their own status" ON public.user_status;
CREATE POLICY "Users can insert their own status" ON public.user_status
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update their own status" ON public.user_status
  FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete their own status" ON public.user_status
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
