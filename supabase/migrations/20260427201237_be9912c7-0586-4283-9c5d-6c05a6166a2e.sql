-- Trigger to keep articles.likes_count in sync with article_likes table
CREATE OR REPLACE FUNCTION public.sync_article_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles SET likes_count = likes_count + 1 WHERE id = NEW.article_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.article_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_article_likes_count ON public.article_likes;
CREATE TRIGGER trg_sync_article_likes_count
AFTER INSERT OR DELETE ON public.article_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_article_likes_count();

-- Backfill existing counts
UPDATE public.articles a
SET likes_count = COALESCE((SELECT COUNT(*) FROM public.article_likes WHERE article_id = a.id), 0);