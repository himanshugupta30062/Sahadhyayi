-- Ensure comment visibility never exceeds the visibility of its parent post.
-- The previous friends-only rule could expose comments on followers-only posts
-- to friends who did not follow the author, and hid comments on public posts
-- from readers who were not friends.
DROP POLICY IF EXISTS "Users can view comments on friends posts" ON public.post_comments;

CREATE POLICY "Readers can view comments allowed by parent post audience"
ON public.post_comments
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.posts AS p
    WHERE p.id = post_comments.post_id
      AND (
        p.user_id = (SELECT auth.uid())
        OR p.audience = 'public'
        OR (
          p.audience = 'friends'
          AND EXISTS (
            SELECT 1
            FROM public.friends AS f
            WHERE (f.user1_id = (SELECT auth.uid()) AND f.user2_id = p.user_id)
               OR (f.user2_id = (SELECT auth.uid()) AND f.user1_id = p.user_id)
          )
        )
        OR (
          p.audience = 'followers'
          AND EXISTS (
            SELECT 1
            FROM public.user_follows AS uf
            WHERE uf.follower_id = (SELECT auth.uid())
              AND uf.following_id = p.user_id
          )
        )
      )
  )
);

COMMENT ON POLICY "Readers can view comments allowed by parent post audience" ON public.post_comments IS
  'A comment is visible only to its author or readers permitted by the parent post audience.';
