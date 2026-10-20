
-- Merge equivalent or redundant owner/admin policy overlap without widening access.
ALTER POLICY "Anyone can view published articles" ON public.articles
  USING (is_published = true OR user_id = (SELECT auth.uid()));
DROP POLICY "Users can view own articles" ON public.articles;

DROP POLICY "Users can insert their own profile" ON public.profiles;
DROP POLICY "Users can view own profiles" ON public.profiles;
DROP POLICY "Users can view their own profile" ON public.profiles;

DROP POLICY "Users can delete their own profile" ON public.user_profile;
DROP POLICY "Users can insert their own profile" ON public.user_profile;
DROP POLICY "Users can view their own profile" ON public.user_profile;
DROP POLICY "Users can update their own profile" ON public.user_profile;

DROP POLICY "Admins can view all roles" ON public.user_roles;

ALTER POLICY "Creators can update their group chats" ON public.group_chats
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.group_chat_members gcm
      WHERE gcm.group_id = group_chats.id
        AND gcm.user_id = (SELECT auth.uid())
        AND gcm.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.group_chat_members gcm
      WHERE gcm.group_id = group_chats.id
        AND gcm.user_id = (SELECT auth.uid())
        AND gcm.role = 'admin'
    )
  );
DROP POLICY "Group admins can update group chats" ON public.group_chats;

DROP POLICY "Users can manage their own location" ON public.user_locations;
CREATE POLICY "Users can insert their own location" ON public.user_locations
  FOR INSERT TO public WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own location" ON public.user_locations
  FOR UPDATE TO public USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own location" ON public.user_locations
  FOR DELETE TO public USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Authors can view attendees for their events" ON public.author_event_attendees
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.author_events
      JOIN public.authors ON authors.id = author_events.author_id
      WHERE author_events.id = author_event_attendees.event_id
        AND authors.id = (SELECT auth.uid())
    )
  );
DROP POLICY "Users can manage their event attendance" ON public.author_event_attendees;
CREATE POLICY "Users can insert their event attendance" ON public.author_event_attendees
  FOR INSERT TO public WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their event attendance" ON public.author_event_attendees
  FOR UPDATE TO public USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their event attendance" ON public.author_event_attendees
  FOR DELETE TO public USING ((SELECT auth.uid()) = user_id);
