-- Fix critical security vulnerabilities

-- 1. Remove overly permissive contact_messages policy and create admin-only access
DROP POLICY IF EXISTS "Authenticated can select contact messages" ON public.contact_messages;

-- Create admin-only policy for contact messages
CREATE POLICY "Only admins can view contact messages" 
ON public.contact_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 2. Update database functions with proper security settings
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

CREATE OR REPLACE FUNCTION public.get_website_visit_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.website_visits);
END;
$function$;

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