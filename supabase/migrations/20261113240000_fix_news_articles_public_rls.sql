-- Fix public read policy on public.news_articles, public.literary_event_categories, and public.literary_events
-- so anonymous readers only evaluate public status without executing is_admin() or has_permission()
-- which require elevated/authenticated privileges and trigger error 42501 (permission denied for function is_admin).

-- 1. News Articles
DROP POLICY IF EXISTS "Published news is publicly readable" ON public.news_articles;
DROP POLICY IF EXISTS "Staff can view all news articles" ON public.news_articles;

CREATE POLICY "Published news is publicly readable"
  ON public.news_articles FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Staff can view all news articles"
  ON public.news_articles FOR SELECT TO authenticated
  USING (
    coalesce((SELECT public.is_admin()), false)
    OR coalesce((SELECT public.has_permission('content.edit')), false)
    OR coalesce((SELECT public.has_permission('content.publish')), false)
  );

-- 2. Literary Event Categories
DROP POLICY IF EXISTS "Anyone can view active event categories" ON public.literary_event_categories;
DROP POLICY IF EXISTS "Staff can view all event categories" ON public.literary_event_categories;

CREATE POLICY "Anyone can view active event categories"
  ON public.literary_event_categories FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Staff can view all event categories"
  ON public.literary_event_categories FOR SELECT TO authenticated
  USING (coalesce((SELECT public.is_admin()), false));

-- 3. Literary Events
DROP POLICY IF EXISTS "Anyone can view published book events" ON public.literary_events;
DROP POLICY IF EXISTS "Staff can view all book events" ON public.literary_events;

CREATE POLICY "Anyone can view published book events"
  ON public.literary_events FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Staff can view all book events"
  ON public.literary_events FOR SELECT TO authenticated
  USING (coalesce((SELECT public.is_admin()), false));
