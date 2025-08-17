-- Fix the remaining critical functions that need SET search_path
-- These are the most commonly used functions that need to be secured

-- Fix normalize_name function
CREATE OR REPLACE FUNCTION public.normalize_name(name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN LOWER(TRIM(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g')));
END;
$function$;

-- Fix refresh_book_ratings_agg function
CREATE OR REPLACE FUNCTION public.refresh_book_ratings_agg(target_book uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.book_ratings_agg (book_id, avg_rating, rating_count, updated_at)
  SELECT target_book,
         COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::NUMERIC(3,2) AS avg_rating,
         COALESCE(COUNT(*), 0)::INT AS rating_count,
         now()
  FROM public.book_ratings
  WHERE book_id = target_book
  ON CONFLICT (book_id) DO UPDATE SET
    avg_rating = EXCLUDED.avg_rating,
    rating_count = EXCLUDED.rating_count,
    updated_at = EXCLUDED.updated_at;
END;
$function$;

-- Fix notify_author_followers function  
CREATE OR REPLACE FUNCTION public.notify_author_followers(author_uuid uuid, notification_type text, notification_title text, notification_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, author_id, type, title, message)
  SELECT 
    af.user_id,
    author_uuid,
    notification_type,
    notification_title,
    notification_message
  FROM public.author_followers af
  WHERE af.author_id = author_uuid;
END;
$function$;