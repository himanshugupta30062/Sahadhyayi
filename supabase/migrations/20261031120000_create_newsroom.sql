-- Sahadhyayi Newsroom: editorial news for books, authors, education and research.
CREATE TABLE IF NOT EXISTS public.news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 5 AND 200),
  slug text NOT NULL UNIQUE CHECK (char_length(slug) BETWEEN 3 AND 140),
  summary text CHECK (summary IS NULL OR char_length(summary) <= 400),
  content text NOT NULL CHECK (char_length(btrim(content)) >= 30),
  cover_image_url text,
  category text NOT NULL CHECK (category IN ('books','authors','education','research')),
  source_name text,
  source_url text,
  author_name text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT news_published_requires_timestamp CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS news_articles_published_feed_idx
  ON public.news_articles (published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS news_articles_category_feed_idx
  ON public.news_articles (category, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS news_articles_created_by_idx ON public.news_articles (created_by);

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.news_articles FROM PUBLIC;
GRANT SELECT ON public.news_articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_articles TO authenticated;

DROP POLICY IF EXISTS "Published news is publicly readable" ON public.news_articles;
CREATE POLICY "Published news is publicly readable"
  ON public.news_articles FOR SELECT TO anon, authenticated
  USING (status = 'published' OR (SELECT public.is_admin()) OR (SELECT public.has_permission('content.edit')) OR (SELECT public.has_permission('content.publish')));

DROP POLICY IF EXISTS "Authorized editors can create news" ON public.news_articles;
CREATE POLICY "Authorized editors can create news"
  ON public.news_articles FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND ((SELECT public.is_admin()) OR (SELECT public.has_permission('content.publish')))
  );

DROP POLICY IF EXISTS "Authorized editors can update news" ON public.news_articles;
CREATE POLICY "Authorized editors can update news"
  ON public.news_articles FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()) OR (SELECT public.has_permission('content.edit')) OR (SELECT public.has_permission('content.publish')))
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.has_permission('content.edit')) OR (SELECT public.has_permission('content.publish')));

DROP POLICY IF EXISTS "Administrators can delete news" ON public.news_articles;
CREATE POLICY "Administrators can delete news"
  ON public.news_articles FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

CREATE OR REPLACE FUNCTION public.set_news_articles_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_news_articles_updated_at ON public.news_articles;
CREATE TRIGGER trg_news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_news_articles_updated_at();
REVOKE ALL ON FUNCTION public.set_news_articles_updated_at() FROM PUBLIC, anon, authenticated;
