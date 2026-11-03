ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS related_book_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_author_names text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_paper_ids text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS news_articles_related_books_gin_idx
  ON public.news_articles USING gin (related_book_ids);
CREATE INDEX IF NOT EXISTS news_articles_related_authors_gin_idx
  ON public.news_articles USING gin (related_author_names);
