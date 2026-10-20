-- Explicit post audiences for the social feed.
-- Existing posts default to friends-only, preserving their current effective visibility.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'friends';

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_audience_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_audience_check
  CHECK (audience IN ('public', 'followers', 'friends', 'private'));

CREATE INDEX IF NOT EXISTS posts_audience_created_at_id_idx
  ON public.posts (audience, created_at DESC, id DESC);

-- Replace the previous owner/friends-only policy with an explicit visibility contract.
-- "public" means visible to signed-in users; anonymous access remains disabled.
DROP POLICY IF EXISTS "Users can view their own posts and friends' posts" ON public.posts;
CREATE POLICY "Readers can view posts allowed by audience"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR audience = 'public'
    OR (
      audience = 'friends'
      AND EXISTS (
        SELECT 1
        FROM public.friends f
        WHERE
          (f.user1_id = auth.uid() AND f.user2_id = posts.user_id)
          OR (f.user2_id = auth.uid() AND f.user1_id = posts.user_id)
      )
    )
    OR (
      audience = 'followers'
      AND EXISTS (
        SELECT 1
        FROM public.user_follows uf
        WHERE uf.follower_id = auth.uid()
          AND uf.following_id = posts.user_id
      )
    )
  );

COMMENT ON COLUMN public.posts.audience IS
  'Visibility for authenticated readers: public, followers, friends, or private. Existing posts default to friends.';
