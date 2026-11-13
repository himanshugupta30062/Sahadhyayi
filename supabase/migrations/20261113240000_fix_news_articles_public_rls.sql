-- Fix public read policy on public.news_articles so anonymous readers only evaluate status = 'published'
-- without executing is_admin() or has_permission() which require elevated/authenticated privileges.

DROP POLICY IF EXISTS "Published news is publicly readable" ON public.news_articles;
DROP POLICY IF EXISTS "Staff can view all news articles" ON public.news_articles;

-- 1. Public read policy: Anyone (anon and authenticated) can read published news.
CREATE POLICY "Published news is publicly readable"
  ON public.news_articles FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- 2. Staff read policy: Authenticated staff / admins can view draft and archived news.
CREATE POLICY "Staff can view all news articles"
  ON public.news_articles FOR SELECT TO authenticated
  USING (
    coalesce((SELECT public.is_admin()), false)
    OR coalesce((SELECT public.has_permission('content.edit')), false)
    OR coalesce((SELECT public.has_permission('content.publish')), false)
  );
