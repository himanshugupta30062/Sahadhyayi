
-- Evaluate auth.uid()/auth.<function>() once per statement where policies use it.
DO $rls_auth_initplan$
DECLARE
  p record;
  v_qual text;
  v_check text;
  v_sql text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        COALESCE(qual, '') ~* 'auth\.[a-z_]+\(\)'
        OR COALESCE(with_check, '') ~* 'auth\.[a-z_]+\(\)'
      )
  LOOP
    v_qual := CASE WHEN p.qual IS NULL THEN NULL
      ELSE regexp_replace(p.qual, 'auth\.([a-z_]+)\(\)', '(select auth.\1())', 'gi')
      END;
    v_check := CASE WHEN p.with_check IS NULL THEN NULL
      ELSE regexp_replace(p.with_check, 'auth\.([a-z_]+)\(\)', '(select auth.\1())', 'gi')
      END;
    v_sql := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    IF v_qual IS NOT NULL THEN v_sql := v_sql || format(' USING (%s)', v_qual); END IF;
    IF v_check IS NOT NULL THEN v_sql := v_sql || format(' WITH CHECK (%s)', v_check); END IF;
    EXECUTE v_sql;
  END LOOP;
END
$rls_auth_initplan$;

-- Merge article owner/public reads without broadening draft visibility.
ALTER POLICY "Anyone can view published articles" ON public.articles
  USING (is_published = true OR user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Users can view own articles" ON public.articles;

-- The combined owner/friend profile policy already includes self access.
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- The authenticated ALL policy already restricts legacy user_profile operations to the owner.
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profile;

-- A separate admin SELECT policy is redundant with the admin-only ALL policy.
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- One group-chat UPDATE rule for either the creator or a group admin.
DROP POLICY IF EXISTS "Group admins can update group chats" ON public.group_chats;
ALTER POLICY "Creators can update their group chats" ON public.group_chats
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.group_chat_members AS gcm
      WHERE gcm.group_id = group_chats.id
        AND gcm.user_id = (SELECT auth.uid())
        AND gcm.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.group_chat_members AS gcm
      WHERE gcm.group_id = group_chats.id
        AND gcm.user_id = (SELECT auth.uid())
        AND gcm.role = 'admin'
    )
  );

-- Split user_locations write rules from mutual-consent SELECT access.
DROP POLICY IF EXISTS "Users can manage their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can insert their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can delete their own location" ON public.user_locations;
CREATE POLICY "Users can insert their own location" ON public.user_locations
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own location" ON public.user_locations
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own location" ON public.user_locations
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Preserve private attendance rows for their owner and event authors who own the event.
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
DROP POLICY IF EXISTS "Users can manage their event attendance" ON public.author_event_attendees;
DROP POLICY IF EXISTS "Users can insert their event attendance" ON public.author_event_attendees;
DROP POLICY IF EXISTS "Users can update their event attendance" ON public.author_event_attendees;
DROP POLICY IF EXISTS "Users can delete their event attendance" ON public.author_event_attendees;
CREATE POLICY "Users can insert their event attendance" ON public.author_event_attendees
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their event attendance" ON public.author_event_attendees
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their event attendance" ON public.author_event_attendees
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Keep public access to published author events/posts and owner access to drafts, without ALL-policy overlap.
ALTER POLICY "Anyone can view published events" ON public.author_events
  USING (
    is_published = true OR EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = author_events.author_id AND authors.id = (SELECT auth.uid())
    )
  );
DROP POLICY IF EXISTS "Authors can manage their events" ON public.author_events;
DROP POLICY IF EXISTS "Authors can create their events" ON public.author_events;
DROP POLICY IF EXISTS "Authors can update their events" ON public.author_events;
DROP POLICY IF EXISTS "Authors can delete their events" ON public.author_events;
CREATE POLICY "Authors can create their events" ON public.author_events
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.authors WHERE authors.id = author_events.author_id AND authors.id = (SELECT auth.uid())
  ));
CREATE POLICY "Authors can update their events" ON public.author_events
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.authors WHERE authors.id = author_events.author_id AND authors.id = (SELECT auth.uid())
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.authors WHERE authors.id = author_events.author_id AND authors.id = (SELECT auth.uid())
  ));
CREATE POLICY "Authors can delete their events" ON public.author_events
  FOR DELETE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.authors WHERE authors.id = author_events.author_id AND authors.id = (SELECT auth.uid())
  ));

ALTER POLICY "Anyone can view published posts" ON public.author_posts
  USING (
    is_published = true OR EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = author_posts.author_id AND authors.id = (SELECT auth.uid())
    )
  );
DROP POLICY IF EXISTS "Authors can manage their own posts" ON public.author_posts;
DROP POLICY IF EXISTS "Authors can create their own posts" ON public.author_posts;
DROP POLICY IF EXISTS "Authors can update their own posts" ON public.author_posts;
DROP POLICY IF EXISTS "Authors can delete their own posts" ON public.author_posts;
CREATE POLICY "Authors can create their own posts" ON public.author_posts
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.authors WHERE authors.id = author_posts.author_id AND authors.id = (SELECT auth.uid())
  ));
CREATE POLICY "Authors can update their own posts" ON public.author_posts
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.authors WHERE authors.id = author_posts.author_id AND authors.id = (SELECT auth.uid())
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.authors WHERE authors.id = author_posts.author_id AND authors.id = (SELECT auth.uid())
  ));
CREATE POLICY "Authors can delete their own posts" ON public.author_posts
  FOR DELETE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.authors WHERE authors.id = author_posts.author_id AND authors.id = (SELECT auth.uid())
  ));

-- Published-post reaction rows or the caller's own reaction are visible; writes remain owner-scoped.
ALTER POLICY "Anyone can view reactions on published posts" ON public.author_post_reactions
  USING (
    EXISTS (SELECT 1 FROM public.author_posts
      WHERE author_posts.id = author_post_reactions.post_id AND author_posts.is_published = true)
    OR user_id = (SELECT auth.uid())
  );
DROP POLICY IF EXISTS "Authenticated users can manage their reactions" ON public.author_post_reactions;
DROP POLICY IF EXISTS "Users can add their own reactions" ON public.author_post_reactions;
DROP POLICY IF EXISTS "Users can update their own reactions" ON public.author_post_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.author_post_reactions;
CREATE POLICY "Users can add their own reactions" ON public.author_post_reactions
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own reactions" ON public.author_post_reactions
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own reactions" ON public.author_post_reactions
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Merge equivalent question visibility rules without exposing unanswered drafts.
ALTER POLICY "Anyone can view published answered questions" ON public.author_questions
  USING (
    (is_published = true AND is_answered = true)
    OR EXISTS (SELECT 1 FROM public.authors
      WHERE authors.id = author_questions.author_id AND authors.id = (SELECT auth.uid()))
    OR user_id = (SELECT auth.uid())
  );
DROP POLICY IF EXISTS "Authors can view all questions for them" ON public.author_questions;
DROP POLICY IF EXISTS "Users can view their own questions" ON public.author_questions;

-- Do not expose follower identities through RLS; use public aggregate count RPCs.
DROP POLICY IF EXISTS "Authors can view follower count only" ON public.author_followers;
DROP POLICY IF EXISTS "Public can view follower counts" ON public.author_followers;

-- Separate admin-only writes from public read policies to avoid needless overlaps.
DROP POLICY IF EXISTS "Only admins can manage questions" ON public.book_quiz_questions;
DROP POLICY IF EXISTS "Anyone can view questions" ON public.book_quiz_questions;
DROP POLICY IF EXISTS "Only admins can insert questions" ON public.book_quiz_questions;
DROP POLICY IF EXISTS "Only admins can update questions" ON public.book_quiz_questions;
DROP POLICY IF EXISTS "Only admins can delete questions" ON public.book_quiz_questions;
CREATE POLICY "Anyone can view questions" ON public.book_quiz_questions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Only admins can insert questions" ON public.book_quiz_questions
  FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can update questions" ON public.book_quiz_questions
  FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can delete questions" ON public.book_quiz_questions
  FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text));

DROP POLICY IF EXISTS "Only admins can manage badges" ON public.game_badges;
DROP POLICY IF EXISTS "Anyone can view badges" ON public.game_badges;
DROP POLICY IF EXISTS "Only admins can insert badges" ON public.game_badges;
DROP POLICY IF EXISTS "Only admins can update badges" ON public.game_badges;
DROP POLICY IF EXISTS "Only admins can delete badges" ON public.game_badges;
CREATE POLICY "Anyone can view badges" ON public.game_badges
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Only admins can insert badges" ON public.game_badges
  FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can update badges" ON public.game_badges
  FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can delete badges" ON public.game_badges
  FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text));

DROP POLICY IF EXISTS "Only admins can manage books table" ON public.books;
DROP POLICY IF EXISTS "Anyone can view books table" ON public.books;
DROP POLICY IF EXISTS "Only admins can insert books table" ON public.books;
DROP POLICY IF EXISTS "Only admins can update books table" ON public.books;
DROP POLICY IF EXISTS "Only admins can delete books table" ON public.books;
CREATE POLICY "Anyone can view books table" ON public.books
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can insert books table" ON public.books
  FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can update books table" ON public.books
  FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can delete books table" ON public.books
  FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text));

-- Merge social comment/like reads without changing the resulting visibility predicates.
ALTER POLICY "Users can view comments on friends posts" ON public.post_comments
  USING (
    EXISTS (
      SELECT 1 FROM public.posts AS p
      JOIN public.friends AS f ON (
        (f.user1_id = (SELECT auth.uid()) AND f.user2_id = p.user_id)
        OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = p.user_id)
      )
      WHERE p.id = post_comments.post_id
    )
    OR EXISTS (SELECT 1 FROM public.posts AS p
      WHERE p.id = post_comments.post_id AND p.user_id = (SELECT auth.uid()))
    OR user_id = (SELECT auth.uid())
  );
DROP POLICY IF EXISTS "Users can view comments on their posts" ON public.post_comments;
DROP POLICY IF EXISTS "Users can view their own comments" ON public.post_comments;

ALTER POLICY "Users can view likes on their posts" ON public.post_likes
  USING (
    EXISTS (SELECT 1 FROM public.posts AS p
      WHERE p.id = post_likes.post_id AND p.user_id = (SELECT auth.uid()))
    OR user_id = (SELECT auth.uid())
  );
DROP POLICY IF EXISTS "Users can view their own likes" ON public.post_likes;

ALTER POLICY "Admins can remove members" ON public.group_chat_members
  USING (is_group_admin(group_id, (SELECT auth.uid())) OR user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_chat_members;

-- Remove the overlap between the friend-status read rule and the owner ALL rule.
ALTER POLICY "Users can view friends statuses" ON public.user_status
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.friends AS f
      WHERE (f.user1_id = (SELECT auth.uid()) AND f.user2_id = user_status.user_id)
         OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = user_status.user_id)
    )
  );
DROP POLICY IF EXISTS "Users can view their own status" ON public.user_status;
DROP POLICY IF EXISTS "Users can update their own status" ON public.user_status;
DROP POLICY IF EXISTS "Users can insert their own status" ON public.user_status;
DROP POLICY IF EXISTS "Users can delete their own status" ON public.user_status;
CREATE POLICY "Users can insert their own status" ON public.user_status
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update their own status" ON public.user_status
  FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete their own status" ON public.user_status
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- Combine avatar SELECT rules into a single policy preserving self/friend/search consent.
ALTER POLICY "Authenticated users can view avatars in user search" ON public.user_avatars
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS viewer
      WHERE viewer.id = (SELECT auth.uid()) AND viewer.location_sharing IS TRUE
    )
    OR user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.friends AS f
      WHERE (f.user1_id = (SELECT auth.uid()) AND f.user2_id = user_avatars.user_id)
         OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = user_avatars.user_id)
    )
  );
DROP POLICY IF EXISTS "Users can view their own avatar" ON public.user_avatars;
DROP POLICY IF EXISTS "Users can view their own avatars and friends' avatars" ON public.user_avatars;

-- Approved books are public; authenticated admin/owner access uses one SELECT policy.
ALTER POLICY "Anyone can view approved books" ON public.user_published_books TO anon;
ALTER POLICY "Admins can view all published books" ON public.user_published_books
  USING (
    status = 'approved'::text
    OR has_role((SELECT auth.uid()), 'admin'::text)
    OR user_id = (SELECT auth.uid())
  );
DROP POLICY IF EXISTS "Users can view own published books" ON public.user_published_books;

ALTER POLICY "Admins can update all published books" ON public.user_published_books
  USING (
    has_role((SELECT auth.uid()), 'admin'::text)
    OR (user_id = (SELECT auth.uid()) AND status = ANY (ARRAY['draft'::text, 'rejected'::text]))
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text)
    OR (user_id = (SELECT auth.uid()) AND status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'rejected'::text]))
  );
DROP POLICY IF EXISTS "Users can update own draft/rejected books" ON public.user_published_books;

DROP POLICY IF EXISTS "Users can view their own WhatsApp contacts" ON public.whatsapp_contacts;

NOTIFY pgrst, 'reload schema';


-- The latest post-audience migration added one unoptimized RLS expression; keep it consistent.
ALTER POLICY "Readers can view posts allowed by audience" ON public.posts
  USING (
    (SELECT auth.uid()) = user_id
    OR audience = 'public'::text
    OR (
      audience = 'friends'::text
      AND EXISTS (
        SELECT 1 FROM public.friends AS f
        WHERE (f.user1_id = (SELECT auth.uid()) AND f.user2_id = posts.user_id)
           OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = posts.user_id)
      )
    )
    OR (
      audience = 'followers'::text
      AND EXISTS (
        SELECT 1 FROM public.user_follows AS uf
        WHERE uf.follower_id = (SELECT auth.uid())
          AND uf.following_id = posts.user_id
      )
    )
  );
