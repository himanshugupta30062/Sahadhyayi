
-- 1) Add repost columns to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS repost_of_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reposts_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS posts_repost_of_id_idx ON public.posts(repost_of_id);

-- Trigger to maintain reposts_count on parent post
CREATE OR REPLACE FUNCTION public.update_post_reposts_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.repost_of_id IS NOT NULL THEN
    UPDATE public.posts SET reposts_count = reposts_count + 1 WHERE id = NEW.repost_of_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.repost_of_id IS NOT NULL THEN
    UPDATE public.posts SET reposts_count = GREATEST(0, reposts_count - 1) WHERE id = OLD.repost_of_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_reposts_count ON public.posts;
CREATE TRIGGER trg_posts_reposts_count
AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_post_reposts_count();

-- 2) Comment likes table
CREATE TABLE IF NOT EXISTS public.post_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.post_comment_likes TO authenticated;
GRANT ALL ON public.post_comment_likes TO service_role;

ALTER TABLE public.post_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read comment likes"
ON public.post_comment_likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can like comments as themselves"
ON public.post_comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
ON public.post_comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS post_comment_likes_comment_id_idx ON public.post_comment_likes(comment_id);
