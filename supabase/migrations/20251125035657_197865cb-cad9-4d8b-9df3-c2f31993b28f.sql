-- Phase 2c: Fix view and complete function search path fixes

-- Drop the problematic view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.profiles_public CASCADE;

-- Create view with explicit column selection (views don't use SECURITY DEFINER)
CREATE VIEW public.profiles_public AS
SELECT 
  id,
  username,
  full_name,
  profile_photo_url,
  bio,
  created_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.profiles_public SET (security_invoker = true);

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Fix remaining functions with missing search_path
CREATE OR REPLACE FUNCTION public.update_author_books_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
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

CREATE OR REPLACE FUNCTION public.get_authors_with_books()
RETURNS TABLE(id uuid, name text, bio text, profile_image_url text, location text, website_url text, social_links jsonb, genres text[], books_count integer, followers_count integer, rating numeric, upcoming_events integer, created_at timestamp with time zone, updated_at timestamp with time zone, actual_books_count bigint)
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

CREATE OR REPLACE FUNCTION public.notify_followers_on_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_published = true THEN
    INSERT INTO public.notifications (user_id, author_id, type, title, message)
    SELECT 
      af.user_id,
      NEW.author_id,
      'author_event',
      a.name || ' has a new event',
      NEW.title || ' - ' || to_char(NEW.start_date, 'Mon DD, YYYY')
    FROM public.author_followers af
    JOIN public.authors a ON a.id = NEW.author_id
    WHERE af.author_id = NEW.author_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_followers_on_qa_answer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.is_answered = true AND OLD.is_answered = false AND NEW.is_published = true THEN
    INSERT INTO public.notifications (user_id, author_id, type, title, message)
    SELECT 
      af.user_id,
      NEW.author_id,
      'qa_answer',
      a.name || ' answered a question',
      CASE 
        WHEN LENGTH(NEW.answer) > 100 THEN LEFT(NEW.answer, 100) || '...'
        ELSE NEW.answer
      END
    FROM public.author_followers af
    JOIN public.authors a ON a.id = NEW.author_id
    WHERE af.author_id = NEW.author_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_contact_messages_admin()
RETURNS TABLE(id uuid, name text, email text, message text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    cm.id,
    cm.name,
    cm.email,
    cm.message,
    cm.created_at
  FROM public.contact_messages cm
  ORDER BY cm.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_name(name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN LOWER(TRIM(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g')));
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_friend_locations()
RETURNS TABLE(id uuid, full_name text, location_lat numeric, location_lng numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.location_lat,
    p.location_lng
  FROM profiles p
  JOIN friends f ON (
    (f.user1_id = auth.uid() AND f.user2_id = p.id) OR
    (f.user2_id = auth.uid() AND f.user1_id = p.id)
  )
  WHERE 
    p.location_sharing = true 
    AND EXISTS (
      SELECT 1 FROM profiles requesting_user 
      WHERE requesting_user.id = auth.uid() 
      AND requesting_user.location_sharing = true
    )
    AND p.location_lat IS NOT NULL 
    AND p.location_lng IS NOT NULL
    AND p.id != auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_profiles_for_search(search_term text DEFAULT ''::text)
RETURNS TABLE(id uuid, username text, full_name text, bio text, profile_photo_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
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