-- Protect profile rows containing personal details. Public profile search remains available via its scoped RPC.
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Reader taste profiles are shared only with the owner and their established friends.
DROP POLICY IF EXISTS "reading_dna_read" ON public.reading_dna;
CREATE POLICY "reading_dna_owner_and_friends_read" ON public.reading_dna
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.are_friends(auth.uid(), user_id));

-- Expose spoiler data to the client only through the chapter-aware view.
CREATE OR REPLACE VIEW public.spoiler_threads_safe
WITH (security_invoker = false)
AS
SELECT
  t.id, t.book_id, t.user_id, t.title, t.min_chapter, t.created_at, t.updated_at,
  CASE WHEN public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter THEN t.body ELSE NULL END AS body,
  (public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter) AS is_unlocked
FROM public.spoiler_threads t;
REVOKE SELECT ON TABLE public.spoiler_threads FROM anon, authenticated;
DROP POLICY IF EXISTS "spoiler_threads_read" ON public.spoiler_threads;
GRANT SELECT ON public.spoiler_threads_safe TO authenticated;

CREATE OR REPLACE FUNCTION public.can_view_spoiler_thread_comment(
  _thread_id uuid,
  _comment_user_id uuid,
  _min_chapter integer
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT _comment_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.spoiler_threads t
      WHERE t.id = _thread_id
        AND public.user_chapter_progress(auth.uid(), t.book_id) >= GREATEST(t.min_chapter, _min_chapter)
    );
$$;
REVOKE ALL ON FUNCTION public.can_view_spoiler_thread_comment(uuid, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_spoiler_thread_comment(uuid, uuid, integer) TO authenticated;
DROP POLICY IF EXISTS "spoiler_thread_comments_read" ON public.spoiler_thread_comments;
CREATE POLICY "spoiler_thread_comments_chapter_access" ON public.spoiler_thread_comments
  FOR SELECT TO authenticated
  USING (public.can_view_spoiler_thread_comment(thread_id, user_id, min_chapter));

-- Count-only content votes let readers see engagement without exposing voters.
CREATE OR REPLACE FUNCTION public.get_content_vote_counts(p_content_ids uuid[])
RETURNS TABLE(content_id uuid, vote_type text, vote_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT cv.content_id, cv.vote_type, count(*)::bigint
  FROM public.content_votes cv
  JOIN public.user_generated_content ugc ON ugc.id = cv.content_id
  WHERE cv.content_id = ANY(COALESCE(p_content_ids, ARRAY[]::uuid[]))
    AND (ugc.is_published OR ugc.user_id = auth.uid())
  GROUP BY cv.content_id, cv.vote_type
  UNION ALL
  SELECT cv.content_id, cv.vote_type, count(*)::bigint
  FROM public.content_votes cv
  JOIN public.content_feedback cf ON cf.id = cv.content_id
  WHERE cv.content_id = ANY(COALESCE(p_content_ids, ARRAY[]::uuid[]))
    AND (cf.user_id = auth.uid() OR public.is_admin())
  GROUP BY cv.content_id, cv.vote_type;
$$;
REVOKE ALL ON FUNCTION public.get_content_vote_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_content_vote_counts(uuid[]) TO anon, authenticated;
DROP POLICY IF EXISTS "Users can view all votes" ON public.content_votes;
CREATE POLICY "Users can view their own votes" ON public.content_votes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE SELECT ON TABLE public.content_votes FROM anon;

-- Article comments remain available on published articles, not on other users' drafts.
DROP POLICY IF EXISTS "Anyone can view comments" ON public.article_comments;
CREATE POLICY "View comments on published articles or own drafts" ON public.article_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.articles a
    WHERE a.id = article_comments.article_id
      AND (a.is_published = true OR a.user_id = auth.uid())
  ));

-- Keep published-article like totals visible without exposing voter identities.
CREATE OR REPLACE FUNCTION public.get_article_like_count(p_article_id uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT count(*)::bigint
  FROM public.article_likes l
  JOIN public.articles a ON a.id = l.article_id
  WHERE l.article_id = p_article_id
    AND (a.is_published = true OR a.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_article_like_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_article_like_count(uuid) TO anon, authenticated;
DROP POLICY IF EXISTS "Anyone can view article likes" ON public.article_likes;
CREATE POLICY "Users can view their own article likes" ON public.article_likes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE SELECT ON TABLE public.article_likes FROM anon;

-- Keep author follower totals visible without revealing the follower list.
CREATE OR REPLACE FUNCTION public.get_article_author_follower_count(p_author_user_id uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT count(*)::bigint FROM public.article_author_followers f
  WHERE f.author_user_id = p_author_user_id;
$$;
REVOKE ALL ON FUNCTION public.get_article_author_follower_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_article_author_follower_count(uuid) TO anon, authenticated;
DROP POLICY IF EXISTS "Anyone can view followers" ON public.article_author_followers;
CREATE POLICY "Users can view their own author follows" ON public.article_author_followers
  FOR SELECT TO authenticated USING (follower_user_id = auth.uid());
REVOKE SELECT ON TABLE public.article_author_followers FROM anon;

-- Comment like totals are scoped to discussions visible to the caller.
CREATE OR REPLACE FUNCTION public.get_post_comment_like_counts(p_comment_ids uuid[])
RETURNS TABLE(comment_id uuid, like_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT pcl.comment_id, count(*)::bigint
  FROM public.post_comment_likes pcl
  JOIN public.post_comments pc ON pc.id = pcl.comment_id
  JOIN public.posts p ON p.id = pc.post_id
  WHERE pcl.comment_id = ANY(COALESCE(p_comment_ids, ARRAY[]::uuid[]))
    AND (pc.user_id = auth.uid() OR p.user_id = auth.uid() OR public.are_friends(auth.uid(), p.user_id))
  GROUP BY pcl.comment_id;
$$;
REVOKE ALL ON FUNCTION public.get_post_comment_like_counts(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_post_comment_like_counts(uuid[]) TO authenticated;
DROP POLICY IF EXISTS "Anyone authenticated can read comment likes" ON public.post_comment_likes;
CREATE POLICY "Users can view their own comment likes" ON public.post_comment_likes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE SELECT ON TABLE public.post_comment_likes FROM anon;

-- Retire unused legacy groups and comments without changing the current group_chats feature.
DROP POLICY IF EXISTS "Groups are public" ON public.groups;
CREATE POLICY "Users can view groups they created" ON public.groups
  FOR SELECT TO authenticated USING (created_by = auth.uid());
GRANT SELECT ON public.groups TO authenticated;
REVOKE SELECT ON public.groups FROM anon;

DROP POLICY IF EXISTS "Users can view all comments" ON public.content_comments;
CREATE POLICY "Users can view their own legacy comments" ON public.content_comments
  FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE SELECT ON public.content_comments FROM anon;