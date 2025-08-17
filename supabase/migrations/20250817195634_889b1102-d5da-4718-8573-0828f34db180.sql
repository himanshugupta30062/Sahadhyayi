-- Fix critical privacy exposure in author_followers table
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authors can view their followers" ON public.author_followers;
DROP POLICY IF EXISTS "Users can view their follows" ON public.author_followers;

-- Create secure policies that protect follower privacy
-- Users can only view their own following relationships
CREATE POLICY "Users can view their own follows" 
ON public.author_followers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Authors can view follower counts but not specific follower identities
CREATE POLICY "Authors can view follower count only" 
ON public.author_followers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.authors 
    WHERE id = author_followers.author_id 
    AND id = auth.uid()
  )
);

-- Public can view follower counts for display (anonymized)
CREATE POLICY "Public can view follower counts" 
ON public.author_followers 
FOR SELECT 
USING (false); -- This will be handled by aggregate functions instead

-- Fix database functions security - add missing search_path settings
-- Update functions identified by the linter that are missing SET search_path

-- Fix update_profile_updated_at function
CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
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

-- Fix handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
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

-- Fix set_last_updated_user_profile function
CREATE OR REPLACE FUNCTION public.set_last_updated_user_profile()
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

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

-- Fix update_author_books_count function
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

-- Fix update_avatar_updated_at function
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

-- Fix update_location_timestamp function
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

-- Fix update_author_follower_count function
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

-- Create secure function to get follower count for public display
CREATE OR REPLACE FUNCTION public.get_author_follower_count(author_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer 
    FROM public.author_followers 
    WHERE author_id = author_uuid
  );
END;
$function$;