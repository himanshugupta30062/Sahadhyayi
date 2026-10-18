-- The active feed uses public.posts; no client code reads or writes this legacy table.
-- Keep legacy social_posts available to trusted server-side service-role code only.
DROP POLICY IF EXISTS "Select social posts" ON public.social_posts;
DROP POLICY IF EXISTS "Insert social posts" ON public.social_posts;
DROP POLICY IF EXISTS "Delete own social posts" ON public.social_posts;
DROP POLICY IF EXISTS "Update own social posts" ON public.social_posts;
REVOKE ALL ON TABLE public.social_posts FROM anon, authenticated;

-- Book events are written by the server-side logging function and are not read
-- directly by client code. Keep writes governed by the existing insert policies.
DROP POLICY IF EXISTS "Anyone can view book events" ON public.book_events;
REVOKE SELECT ON TABLE public.book_events FROM anon, authenticated;