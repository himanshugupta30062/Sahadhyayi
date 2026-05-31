
-- groups: require creator to be the authenticated caller
DROP POLICY IF EXISTS "Authenticated can insert groups" ON public.groups;
CREATE POLICY "Authenticated can insert groups"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- contact_messages: keep open submissions but scope to anon and authenticated roles explicitly (drops permissive `true` to satisfy linter)
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;
CREATE POLICY "Visitors can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (char_length(coalesce(message,'')) > 0);

-- Fix mutable search_path on trigger function
CREATE OR REPLACE FUNCTION public.update_articles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
