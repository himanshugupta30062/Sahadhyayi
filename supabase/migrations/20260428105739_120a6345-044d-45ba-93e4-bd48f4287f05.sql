-- Drop the duplicate trigger (keep one)
DROP TRIGGER IF EXISTS trg_article_likes_count ON public.article_likes;
DROP FUNCTION IF EXISTS public.update_article_likes_count();

-- Resync likes_count from actual rows
UPDATE public.articles a
SET likes_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT article_id, COUNT(*)::int AS cnt
  FROM public.article_likes
  GROUP BY article_id
) sub
WHERE a.id = sub.article_id;

UPDATE public.articles
SET likes_count = 0
WHERE id NOT IN (SELECT DISTINCT article_id FROM public.article_likes)
  AND likes_count <> 0;