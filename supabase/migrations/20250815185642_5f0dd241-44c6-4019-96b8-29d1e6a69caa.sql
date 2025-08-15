-- Update remaining database functions with proper security settings
-- Part 2: Complete the security hardening

CREATE OR REPLACE FUNCTION public.get_user_bookshelf_stats(user_uuid uuid)
RETURNS TABLE(total_books bigint, reading_books bigint, completed_books bigint, want_to_read_books bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.record_website_visit(ip_addr inet DEFAULT NULL::inet, user_agent_string text DEFAULT NULL::text, page text DEFAULT NULL::text, country_code text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.website_visits (ip_address, user_agent, page_url, country_code)
  VALUES (ip_addr, user_agent_string, page, country_code);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_authors_data()
RETURNS TABLE(id uuid, name text, bio text, profile_image_url text, location text, website_url text, social_links jsonb, genres text[], books_count integer, followers_count integer, rating numeric, upcoming_events integer, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.book_ratings_agg_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.update_avatar_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
SET search_path = 'public'
AS $function$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_books_to_authors()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  book_record RECORD;
  author_record RECORD;
  linked_count INTEGER := 0;
BEGIN
  -- For each book without an author_id
  FOR book_record IN
    SELECT id, author, title
    FROM public.books_library
    WHERE author_id IS NULL AND author IS NOT NULL
  LOOP
    -- Try to find matching author
    SELECT id INTO author_record
    FROM public.authors
    WHERE normalize_name(name) = normalize_name(book_record.author)
    LIMIT 1;
    
    -- If author found, link the book
    IF FOUND THEN
      UPDATE public.books_library
      SET author_id = author_record.id
      WHERE id = book_record.id;
      linked_count := linked_count + 1;
    ELSE
      -- Create new author if not exists
      INSERT INTO public.authors (name, bio, location, genres, books_count)
      VALUES (
        book_record.author,
        'Bio will be updated by the author.',
        'Location to be updated',
        ARRAY['General'],
        0
      )
      RETURNING id INTO author_record.id;
      
      -- Link the book to new author
      UPDATE public.books_library
      SET author_id = author_record.id
      WHERE id = book_record.id;
      linked_count := linked_count + 1;
    END IF;
  END LOOP;
  
  RETURN linked_count;
END;
$function$;