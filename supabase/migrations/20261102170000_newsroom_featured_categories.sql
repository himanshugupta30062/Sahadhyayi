-- Extend editorial taxonomy and support featured stories.
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

ALTER TABLE public.news_articles DROP CONSTRAINT IF EXISTS news_articles_category_check;
ALTER TABLE public.news_articles ADD CONSTRAINT news_articles_category_check
  CHECK (category IN ('books','authors','education','research','events','platform'));

CREATE INDEX IF NOT EXISTS news_articles_featured_feed_idx
  ON public.news_articles (published_at DESC)
  WHERE status = 'published' AND is_featured = true;
