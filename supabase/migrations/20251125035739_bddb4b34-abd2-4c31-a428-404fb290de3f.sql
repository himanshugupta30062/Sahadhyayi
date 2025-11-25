-- Phase 2d: Fix all remaining functions with missing search_path

CREATE OR REPLACE FUNCTION public.get_friend_profile_info(friend_user_id uuid)
RETURNS TABLE(id uuid, name text, username text, bio text, profile_picture_url text, location text, joined_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM friends 
    WHERE ((user1_id = auth.uid() AND user2_id = friend_user_id) OR
           (user2_id = auth.uid() AND user1_id = friend_user_id))
  ) AND auth.uid() != friend_user_id THEN
    RETURN QUERY
    SELECT 
      up.id,
      up.name,
      up.username,
      LEFT(COALESCE(up.bio, ''), 50) || CASE WHEN LENGTH(COALESCE(up.bio, '')) > 50 THEN '...' ELSE '' END as bio,
      up.profile_picture_url,
      NULL::text as location,
      up.joined_at
    FROM user_profile up
    WHERE up.id = friend_user_id;
  ELSE
    RETURN QUERY
    SELECT 
      up.id,
      up.name,
      up.username,
      up.bio,
      up.profile_picture_url,
      up.location,
      up.joined_at
    FROM user_profile up
    WHERE up.id = friend_user_id;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_bookshelf_stats(user_uuid uuid)
RETURNS TABLE(total_books bigint, reading_books bigint, completed_books bigint, want_to_read_books bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_books,
    COUNT(*) FILTER (WHERE status = 'reading')::BIGINT as reading_books,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_books,
    COUNT(*) FILTER (WHERE status = 'want_to_read')::BIGINT as want_to_read_books
  FROM public.user_bookshelf 
  WHERE user_id = user_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_authors_data()
RETURNS TABLE(id uuid, name text, bio text, profile_image_url text, location text, website_url text, social_links jsonb, genres text[], books_count integer, followers_count integer, rating numeric, upcoming_events integer, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.bio,
    a.profile_image_url,
    a.location,
    a.website_url,
    a.social_links,
    a.genres,
    a.books_count,
    a.followers_count,
    a.rating,
    a.upcoming_events,
    a.created_at,
    a.updated_at
  FROM public.authors a
  ORDER BY a.books_count DESC, a.followers_count DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_author_book_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.authors 
  SET books_count = (
    SELECT COUNT(*) 
    FROM public.books_library 
    WHERE LOWER(TRIM(books_library.author)) = LOWER(TRIM(authors.name))
  ),
  updated_at = NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_total_users_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.profiles);
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_books_to_authors()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  book_record RECORD;
  author_record RECORD;
  linked_count INTEGER := 0;
BEGIN
  FOR book_record IN
    SELECT id, author, title
    FROM public.books_library
    WHERE author_id IS NULL AND author IS NOT NULL
  LOOP
    SELECT id INTO author_record
    FROM public.authors
    WHERE normalize_name(name) = normalize_name(book_record.author)
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE public.books_library
      SET author_id = author_record.id
      WHERE id = book_record.id;
      linked_count := linked_count + 1;
    ELSE
      INSERT INTO public.authors (name, bio, location, genres, books_count)
      VALUES (
        book_record.author,
        'Bio will be updated by the author.',
        'Location to be updated',
        ARRAY['General'],
        0
      )
      RETURNING id INTO author_record.id;
      
      UPDATE public.books_library
      SET author_id = author_record.id
      WHERE id = book_record.id;
      linked_count := linked_count + 1;
    END IF;
  END LOOP;
  
  RETURN linked_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_website_visit_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.website_visits);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_nearby_readers(radius_km numeric DEFAULT 10)
RETURNS TABLE(reader_id uuid, reader_name text, book_title text, distance_km numeric, is_friend boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  user_lat numeric;
  user_lng numeric;
BEGIN
  SELECT location_lat, location_lng INTO user_lat, user_lng
  FROM public.profiles 
  WHERE id = auth.uid() AND location_sharing = true;
  
  IF user_lat IS NULL OR user_lng IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    r.user_id as reader_id,
    r.name as reader_name,
    r.book as book_title,
    (6371 * acos(cos(radians(user_lat)) * cos(radians(r.lat)) * 
                cos(radians(r.lng) - radians(user_lng)) + 
                sin(radians(user_lat)) * sin(radians(r.lat)))) as distance_km,
    true as is_friend
  FROM public.readers r
  JOIN public.friends f ON (
    (f.user1_id = auth.uid() AND f.user2_id = r.user_id) OR
    (f.user2_id = auth.uid() AND f.user1_id = r.user_id)
  )
  JOIN public.profiles p ON p.id = r.user_id
  WHERE p.location_sharing = true
  AND r.user_id != auth.uid()
  AND (6371 * acos(cos(radians(user_lat)) * cos(radians(r.lat)) * 
                  cos(radians(r.lng) - radians(user_lng)) + 
                  sin(radians(user_lat)) * sin(radians(r.lat)))) <= radius_km
  ORDER BY distance_km;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_avatar_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_location_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.book_ratings_agg_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  b UUID;
BEGIN
  b := COALESCE(NEW.book_id, OLD.book_id);
  PERFORM public.refresh_book_ratings_agg(b);
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_book_ratings_agg(target_book uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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