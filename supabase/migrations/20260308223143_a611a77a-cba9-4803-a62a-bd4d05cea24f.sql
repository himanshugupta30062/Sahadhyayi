
-- Enable pg_net extension for HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send welcome email on new profile creation
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  user_email text;
  user_name text;
  supabase_url text;
  anon_key text;
BEGIN
  -- Get the user's email from auth.users
  SELECT email, raw_user_meta_data->>'full_name'
  INTO user_email, user_name
  FROM auth.users
  WHERE id = NEW.id;

  IF user_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Use the full_name from profile if available
  user_name := COALESCE(NEW.full_name, user_name, 'Reader');

  supabase_url := 'https://rknxtatvlzunatpyqxro.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U';

  -- Call the edge function via pg_net
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/send-welcome-email',
    body := jsonb_build_object('email', user_email, 'name', user_name),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trg_send_welcome_email ON public.profiles;
CREATE TRIGGER trg_send_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_on_signup();
