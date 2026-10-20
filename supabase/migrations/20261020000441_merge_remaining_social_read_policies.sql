
ALTER POLICY "Users can view comments on friends posts" ON public.post_comments
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      JOIN public.friends f
        ON (
          (f.user1_id = (SELECT auth.uid()) AND f.user2_id = p.user_id)
          OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = p.user_id)
        )
      WHERE p.id = post_comments.post_id
    )
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_comments.post_id
        AND p.user_id = (SELECT auth.uid())
    )
    OR user_id = (SELECT auth.uid())
  );
DROP POLICY "Users can view comments on their posts" ON public.post_comments;
DROP POLICY "Users can view their own comments" ON public.post_comments;

ALTER POLICY "Users can view likes on their posts" ON public.post_likes
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_likes.post_id
        AND p.user_id = (SELECT auth.uid())
    )
    OR user_id = (SELECT auth.uid())
  );
DROP POLICY "Users can view their own likes" ON public.post_likes;

ALTER POLICY "Admins can remove members" ON public.group_chat_members
  USING (
    is_group_admin(group_id, (SELECT auth.uid()))
    OR user_id = (SELECT auth.uid())
  );
DROP POLICY "Users can leave groups" ON public.group_chat_members;
