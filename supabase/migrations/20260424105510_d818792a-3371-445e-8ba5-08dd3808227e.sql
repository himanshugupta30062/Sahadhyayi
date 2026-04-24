-- RPC to safely increment article views (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.increment_article_views(_article_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.articles
  SET views_count = views_count + 1
  WHERE id = _article_id AND is_published = true;
$$;

-- Allow anyone (including anonymous) to call it
GRANT EXECUTE ON FUNCTION public.increment_article_views(uuid) TO anon, authenticated;