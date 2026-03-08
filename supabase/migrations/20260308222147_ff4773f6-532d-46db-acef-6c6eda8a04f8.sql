
-- Article Likes table
CREATE TABLE public.article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);

ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view article likes" ON public.article_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can like articles" ON public.article_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike articles" ON public.article_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger to update likes_count on articles
CREATE OR REPLACE FUNCTION public.update_article_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE articles SET likes_count = likes_count + 1 WHERE id = NEW.article_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE articles SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.article_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_article_likes_count
  AFTER INSERT OR DELETE ON public.article_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_article_likes_count();

-- Article Comments table (supports replies via parent_id)
CREATE TABLE public.article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.article_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.article_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create comments" ON public.article_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.article_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.article_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Article Author Followers table
CREATE TABLE public.article_author_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(author_user_id, follower_user_id)
);

ALTER TABLE public.article_author_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view followers" ON public.article_author_followers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can follow" ON public.article_author_followers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Users can unfollow" ON public.article_author_followers
  FOR DELETE TO authenticated USING (auth.uid() = follower_user_id);

-- Index for performance
CREATE INDEX idx_article_comments_article_id ON public.article_comments(article_id);
CREATE INDEX idx_article_likes_article_id ON public.article_likes(article_id);
CREATE INDEX idx_article_author_followers_author ON public.article_author_followers(author_user_id);
