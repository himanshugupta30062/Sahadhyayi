-- Final security fixes: Update remaining database functions
-- Part 3: Complete all remaining functions

CREATE OR REPLACE FUNCTION public.get_authors_with_books()
RETURNS TABLE(id uuid, name text, bio text, profile_image_url text, location text, website_url text, social_links jsonb, genres text[], books_count integer, followers_count integer, rating numeric, upcoming_events integer, created_at timestamp with time zone, updated_at timestamp with time zone, actual_books_count bigint)
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
    a.updated_at,
    COUNT(bl.id) as actual_books_count
  FROM public.authors a
  INNER JOIN public.books_library bl ON a.id = bl.author_id
  GROUP BY a.id, a.name, a.bio, a.profile_image_url, a.location, a.website_url, 
           a.social_links, a.genres, a.books_count, a.followers_count, a.rating, 
           a.upcoming_events, a.created_at, a.updated_at
  HAVING COUNT(bl.id) > 0
  ORDER BY COUNT(bl.id) DESC, a.followers_count DESC, a.rating DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_author_books_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Update books_count for the affected author(s)
  IF TG_OP = 'DELETE' THEN
    UPDATE public.authors 
    SET books_count = (
      SELECT COUNT(*) 
      FROM public.books_library 
      WHERE author_id = OLD.author_id
    ),
    updated_at = NOW()
    WHERE id = OLD.author_id;
    RETURN OLD;
  ELSE
    UPDATE public.authors 
    SET books_count = (
      SELECT COUNT(*) 
      FROM public.books_library 
      WHERE author_id = NEW.author_id
    ),
    updated_at = NOW()
    WHERE id = NEW.author_id;
    RETURN NEW;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_profiles_for_search(search_term text DEFAULT ''::text)
RETURNS TABLE(id uuid, username text, full_name text, bio text, profile_photo_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    -- Limit bio to first 100 characters to prevent data leakage
    CASE 
      WHEN LENGTH(p.bio) > 100 THEN LEFT(p.bio, 100) || '...'
      ELSE p.bio
    END as bio,
    p.profile_photo_url
  FROM profiles p
  WHERE 
    (search_term = '' OR 
     p.username ILIKE '%' || search_term || '%' OR 
     p.full_name ILIKE '%' || search_term || '%' OR
     p.bio ILIKE '%' || search_term || '%')
    AND p.username IS NOT NULL
    AND p.full_name IS NOT NULL
  ORDER BY 
    CASE 
      WHEN p.username ILIKE search_term || '%' THEN 1
      WHEN p.full_name ILIKE search_term || '%' THEN 2
      ELSE 3
    END,
    p.full_name
  LIMIT 50;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_friend_locations()
RETURNS TABLE(id uuid, full_name text, location_lat numeric, location_lng numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.location_lat,
    p.location_lng
  FROM profiles p
  WHERE 
    p.location_sharing = true 
    AND p.location_lat IS NOT NULL 
    AND p.location_lng IS NOT NULL
    AND (
      p.id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM friends f
        WHERE (
          (f.user1_id = auth.uid() AND f.user2_id = p.id) OR
          (f.user2_id = auth.uid() AND f.user1_id = p.id)
        )
      )
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_author_follower_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.authors 
    SET followers_count = followers_count + 1
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.authors 
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.notify_followers_on_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only notify on insert of published posts
  IF TG_OP = 'INSERT' AND NEW.is_published = true THEN
    -- Get author name for notification
    INSERT INTO public.notifications (user_id, author_id, type, title, message)
    SELECT 
      af.user_id,
      NEW.author_id,
      CASE 
        WHEN NEW.post_type = 'blog_post' THEN 'author_update'
        WHEN NEW.post_type = 'announcement' THEN 'event_announcement'
        ELSE 'author_update'
      END,
      CASE 
        WHEN NEW.title IS NOT NULL THEN NEW.title
        ELSE 'New update from ' || a.name
      END,
      CASE 
        WHEN LENGTH(NEW.content) > 100 THEN LEFT(NEW.content, 100) || '...'
        ELSE NEW.content
      END
    FROM public.author_followers af
    JOIN public.authors a ON a.id = NEW.author_id
    WHERE af.author_id = NEW.author_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_unused_books()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    deleted_count integer := 0;
    book_record RECORD;
BEGIN
    -- Find books that are not in any user's personal library
    -- and have newer versions available
    FOR book_record IN
        SELECT b.*
        FROM books_library b
        LEFT JOIN user_personal_library upl ON upl.book_id = b.id
        WHERE upl.book_id IS NULL -- Not in any user's library
        AND EXISTS (
            -- Check if a newer version exists
            SELECT 1 
            FROM books_library newer
            WHERE LOWER(TRIM(newer.title)) = LOWER(TRIM(b.title))
            AND LOWER(TRIM(COALESCE(newer.author, ''))) = LOWER(TRIM(COALESCE(b.author, '')))
            AND LOWER(TRIM(COALESCE(newer.language, 'english'))) = LOWER(TRIM(COALESCE(b.language, 'english')))
            AND COALESCE(newer.publication_year, 0) > COALESCE(b.publication_year, 0)
        )
    LOOP
        -- Delete the older unused version
        DELETE FROM books_library WHERE id = book_record.id;
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$function$;