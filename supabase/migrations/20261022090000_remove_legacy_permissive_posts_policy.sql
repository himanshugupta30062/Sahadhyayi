-- Remove legacy permissive feed policies after introducing explicit post audiences.
-- PostgreSQL combines permissive SELECT policies with OR, so leaving the historical
-- authenticated USING (true) policy would bypass friends/followers/private visibility.
DROP POLICY IF EXISTS "Authenticated users can view social feed posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view their own posts and friends' posts" ON public.posts;

-- Do not recreate a broad replacement here. The audience-scoped policy introduced by
-- 20261020130000_add_post_audiences.sql is the sole posts SELECT policy expected.
