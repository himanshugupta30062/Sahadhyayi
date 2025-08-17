-- Fix remaining functions that still need SET search_path
-- These functions were missed in the previous migration

-- Fix handle_friend_request_acceptance function
CREATE OR REPLACE FUNCTION public.handle_friend_request_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix notify_followers_on_post function
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

-- Fix book_ratings_agg_trigger function
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

-- Fix notify_followers_on_qa_answer function
CREATE OR REPLACE FUNCTION public.notify_followers_on_qa_answer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only notify when a question gets answered for the first time
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

-- Fix notify_followers_on_event function
CREATE OR REPLACE FUNCTION public.notify_followers_on_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only notify on insert of published events
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