CREATE TABLE IF NOT EXISTS public.article_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  article_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_article_bookmarks_user
  ON public.article_bookmarks (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_bookmarks_article
  ON public.article_bookmarks (article_id);

ALTER TABLE public.article_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON public.article_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON public.article_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.article_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);