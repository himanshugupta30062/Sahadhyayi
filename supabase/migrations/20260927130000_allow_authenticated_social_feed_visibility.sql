-- Social posts are community feed content; keep them private from anonymous
-- clients while allowing every authenticated reader to load the feed.
DROP POLICY IF EXISTS "Authenticated users can view social feed posts" ON public.posts;

CREATE POLICY "Authenticated users can view social feed posts"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (true);
