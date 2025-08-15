-- Fix critical security vulnerabilities - Part 1: Contact Messages

-- 1. Remove overly permissive contact_messages policy 
DROP POLICY IF EXISTS "Authenticated can select contact messages" ON public.contact_messages;

-- Create restricted policy - only allow system/admin access via functions
CREATE POLICY "Contact messages are system managed" 
ON public.contact_messages 
FOR SELECT 
USING (false); -- Block direct access, force through secure functions

-- 2. Create secure function for admin access to contact messages
CREATE OR REPLACE FUNCTION public.get_contact_messages_admin()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  message text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only allow if user has admin role or specific permission
  -- For now, we'll create a basic check - this can be enhanced later
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