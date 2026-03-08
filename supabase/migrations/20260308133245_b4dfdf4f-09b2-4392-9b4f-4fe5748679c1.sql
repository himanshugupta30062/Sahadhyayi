
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  content text NOT NULL DEFAULT '',
  cover_image_url text,
  tags text[] DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  reading_time_minutes integer DEFAULT 1,
  likes_count integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published articles
CREATE POLICY "Anyone can view published articles"
  ON public.articles FOR SELECT
  USING (is_published = true);

-- Users can view their own drafts
CREATE POLICY "Users can view own articles"
  ON public.articles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create articles
CREATE POLICY "Users can create articles"
  ON public.articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own articles
CREATE POLICY "Users can update own articles"
  ON public.articles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own articles
CREATE POLICY "Users can delete own articles"
  ON public.articles FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_articles_user_id ON public.articles(user_id);
CREATE INDEX idx_articles_published ON public.articles(is_published, published_at DESC);
CREATE INDEX idx_articles_slug ON public.articles(slug);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_updated_at();
