-- Phase 2b: Create public profile view and fix function search paths

-- Create a view for public profile information (non-sensitive fields only)
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  username,
  full_name,
  profile_photo_url,
  bio,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Fix search_path for existing functions
CREATE OR REPLACE FUNCTION public.has_location_consent(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.location_sharing_consent 
    WHERE user_id = user_uuid
    AND consented_at IS NOT NULL
  );
$$;

-- Update all existing security definer functions to have proper search_path
CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
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

CREATE OR REPLACE FUNCTION public.handle_updated_at()
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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.set_last_updated_user_profile()
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

CREATE OR REPLACE FUNCTION public.get_author_follower_count(author_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer 
    FROM public.author_followers 
    WHERE author_id = author_uuid
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_website_visit(ip_addr inet DEFAULT NULL::inet, user_agent_string text DEFAULT NULL::text, page text DEFAULT NULL::text, country_code text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.website_visits (ip_address, user_agent, page_url, country_code)
  VALUES (ip_addr, user_agent_string, page, country_code);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_visit_statistics()
RETURNS TABLE(total_visits bigint, unique_countries bigint, visits_today bigint, visits_this_week bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*) as total_visits,
    COUNT(DISTINCT country_code) as unique_countries,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as visits_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as visits_this_week
  FROM public.website_visits;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_friend_request_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO friends (user1_id, user2_id)
    VALUES (
      LEAST(NEW.requester_id, NEW.addressee_id),
      GREATEST(NEW.requester_id, NEW.addressee_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_followers_on_post()
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

-- Continue with remaining functions...
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;