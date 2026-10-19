-- Fix Supabase Auth signup failures caused by the synchronous welcome-email trigger.
-- The old trigger called extensions.http_post(), which does not exist in the
-- managed Supabase project and caused auth.users inserts to roll back.

DROP TRIGGER IF EXISTS trg_send_welcome_email ON public.profiles;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_full_name text;
  v_base_username text;
  v_username text;
  v_avatar text;
  v_suffix integer := 0;
BEGIN
  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''),
    NULLIF(trim(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
    'Reader'
  );

  v_avatar := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'avatar_url'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'picture'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'profile_photo_url'), '')
  );

  v_base_username := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'username'), ''),
    NULLIF(trim(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
    'reader'
  );
  v_base_username := left(
    lower(regexp_replace(v_base_username, '[^a-zA-Z0-9_]', '_', 'g')),
    40
  );

  IF length(v_base_username) < 3 THEN
    v_base_username := v_base_username || '_' ||
      substr(replace(NEW.id::text, '-', ''), 1, 4);
  END IF;

  v_username := v_base_username;
  WHILE EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE lower(p.username) = lower(v_username)
      AND p.id <> NEW.id
  ) LOOP
    v_suffix := v_suffix + 1;
    v_username := left(v_base_username, 50 - length(v_suffix::text) - 1)
      || '_' || v_suffix::text;
    IF v_suffix > 25 THEN
      v_username := left(v_base_username, 40) || '_' ||
        substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
      EXIT;
    END IF;
  END LOOP;

  BEGIN
    INSERT INTO public.profiles (
      id, full_name, username, profile_photo_url, created_at, updated_at
    )
    VALUES (
      NEW.id, v_full_name, v_username, v_avatar,
      COALESCE(NEW.created_at, now()), now()
    )
    ON CONFLICT (id) DO UPDATE
      SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
          updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    -- Profile enrichment is best-effort; do not abort Auth user creation.
    RAISE WARNING 'handle_new_user profile insert warning for user %: %',
      NEW.id, SQLERRM;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Last-resort guard for malformed or unexpected metadata/schema conditions.
  RAISE WARNING 'handle_new_user non-blocking warning for user %: %',
    NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SECURITY DEFINER runs with the function owner's privileges. Avoid adding
-- broad grants to anon/authenticated; retain existing table RLS and policies.
NOTIFY pgrst, 'reload schema';
