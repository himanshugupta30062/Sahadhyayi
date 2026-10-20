
-- Author events: merge published-or-owned read access and keep writes scoped.
ALTER POLICY "Anyone can view published events" ON public.author_events
  USING (is_published = true OR EXISTS (
    SELECT 1 FROM public.authors
    WHERE authors.id = author_events.author_id
      AND authors.id = (SELECT auth.uid())
  ));
DROP POLICY "Authors can manage their events" ON public.author_events;
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

-- Author posts: preserve owner access to drafts and public access to published posts.
ALTER POLICY "Anyone can view published posts" ON public.author_posts
  USING (is_published = true OR EXISTS (
    SELECT 1 FROM public.authors
    WHERE authors.id = author_posts.author_id
      AND authors.id = (SELECT auth.uid())
  ));
DROP POLICY "Authors can manage their own posts" ON public.author_posts;
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

-- Reaction SELECT is published-post rows OR the caller's own reaction; writes stay owner-scoped.
ALTER POLICY "Anyone can view reactions on published posts" ON public.author_post_reactions
  USING (
    EXISTS (SELECT 1 FROM public.author_posts
      WHERE author_posts.id = author_post_reactions.post_id AND author_posts.is_published = true)
    OR user_id = (SELECT auth.uid())
  );
DROP POLICY "Authenticated users can manage their reactions" ON public.author_post_reactions;
CREATE POLICY "Users can add their own reactions" ON public.author_post_reactions
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own reactions" ON public.author_post_reactions
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own reactions" ON public.author_post_reactions
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Merge question visibility into the exact union of published-answer, author-owned and user-owned predicates.
ALTER POLICY "Anyone can view published answered questions" ON public.author_questions
  USING (
    (is_published = true AND is_answered = true)
    OR EXISTS (SELECT 1 FROM public.authors
      WHERE authors.id = author_questions.author_id AND authors.id = (SELECT auth.uid()))
    OR user_id = (SELECT auth.uid())
  );
DROP POLICY "Authors can view all questions for them" ON public.author_questions;
DROP POLICY "Users can view their own questions" ON public.author_questions;

-- Follower identities remain private; follower totals are served by dedicated count RPCs.
DROP POLICY "Authors can view follower count only" ON public.author_followers;
DROP POLICY "Public can view follower counts" ON public.author_followers;

-- Keep admin-only writes separate from the public read policies so anonymous SELECTs do not invoke has_role().
ALTER POLICY "Only admins can manage questions" ON public.book_quiz_questions TO authenticated;
DROP POLICY "Only admins can manage questions" ON public.book_quiz_questions;
CREATE POLICY "Only admins can insert questions" ON public.book_quiz_questions
  FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can update questions" ON public.book_quiz_questions
  FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can delete questions" ON public.book_quiz_questions
  FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text));

ALTER POLICY "Only admins can manage badges" ON public.game_badges TO authenticated;
DROP POLICY "Only admins can manage badges" ON public.game_badges;
CREATE POLICY "Only admins can insert badges" ON public.game_badges
  FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can update badges" ON public.game_badges
  FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can delete badges" ON public.game_badges
  FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text));

ALTER POLICY "Only admins can manage books table" ON public.books TO authenticated;
DROP POLICY "Only admins can manage books table" ON public.books;
CREATE POLICY "Only admins can insert books table" ON public.books
  FOR INSERT TO authenticated WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can update books table" ON public.books
  FOR UPDATE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::text));
CREATE POLICY "Only admins can delete books table" ON public.books
  FOR DELETE TO authenticated USING (has_role((SELECT auth.uid()), 'admin'::text));

-- The ALL owner policy already covers SELECT on a user's own contacts.
DROP POLICY "Users can view their own WhatsApp contacts" ON public.whatsapp_contacts;
