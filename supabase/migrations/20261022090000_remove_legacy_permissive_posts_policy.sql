-- Remove legacy permissive feed policies after introducing explicit post audiences.
-- PostgreSQL combines permissive SELECT policies with OR, so leaving the historical
-- authenticated USING (true) policy would bypass friends/followers/private visibility.
DROP POLICY IF EXISTS "Authenticated users can view social feed posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view their own posts and friends' posts" ON public.posts;

-- Do not recreate a broad replacement here. The audience-scoped policy introduced by
-- 20261020130000_add_post_audiences.sql is the sole posts SELECT policy expected.
DO $verify_post_audience_policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'Readers can view posts allowed by audience'
      AND cmd = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'Expected audience-scoped posts SELECT policy is missing; refusing to finish cleanup';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND cmd = 'SELECT'
      AND policyname IN (
        'Authenticated users can view social feed posts',
        'Anyone can view posts',
        'Users can view their own posts and friends'' posts'
      )
  ) THEN
    RAISE EXCEPTION 'A legacy permissive posts SELECT policy remains after cleanup';
  END IF;
END
$verify_post_audience_policy$;
