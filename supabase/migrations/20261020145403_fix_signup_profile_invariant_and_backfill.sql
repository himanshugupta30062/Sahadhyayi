-- Signup integrity repair:
-- 1. Do not silently create an Auth user without its required profile.
-- 2. Make generated usernames collision-safe, including concurrent signups.
-- 3. Backfill pre-existing Auth users/profiles that missed username/profile creation.
-- 4. Do not send welcome emails to users being backfilled.

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
  v_attempt integer := 0;
BEGIN
  v_full_name := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'name'), ''),
    NULLIF(btrim(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
    'Reader'
  );

  v_avatar := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'avatar_url'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'picture'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'profile_photo_url'), '')
  );

  v_base_username := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'username'), ''),
    NULLIF(btrim(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
    'reader'
  );
  v_base_username := btrim(
    left(lower(regexp_replace(v_base_username, '[^a-zA-Z0-9_]', '_', 'g')), 40),
    '_'
  );
  IF length(v_base_username) < 3 THEN
    v_base_username := 'reader_' || substr(replace(NEW.id::text, '-', ''), 1, 8);
  END IF;

  -- The auth.users trigger can be retried; preserve an existing profile and
  -- fill only missing presentation fields, rather than creating a second row.
  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.id) THEN
    UPDATE public.profiles p
       SET full_name = COALESCE(NULLIF(btrim(p.full_name), ''), v_full_name),
           profile_photo_url = COALESCE(p.profile_photo_url, v_avatar),
           updated_at = now()
     WHERE p.id = NEW.id;
    RETURN NEW;
  END IF;

  LOOP
    IF v_attempt = 0 THEN
      v_username := v_base_username;
    ELSIF v_attempt <= 999 THEN
      v_username := left(v_base_username, greatest(3, 50 - length(v_attempt::text) - 1))
                    || '_' || v_attempt::text;
    ELSE
      v_username := left(v_base_username, greatest(1, 50 - 8 - length(v_attempt::text) - 2))
                    || '_' || substr(replace(NEW.id::text, '-', ''), 1, 8)
                    || '_' || v_attempt::text;
    END IF;

    BEGIN
      INSERT INTO public.profiles (
        id, full_name, username, profile_photo_url, created_at, updated_at
      )
      VALUES (
        NEW.id, v_full_name, v_username, v_avatar,
        COALESCE(NEW.created_at, now()), now()
      );
      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      -- The common recoverable case is a username collision. Retrying is safe;
      -- other failures are not swallowed, so Auth creation rolls back atomically.
      IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.id) THEN
        RETURN NEW;
      END IF;
      v_attempt := v_attempt + 1;
      IF v_attempt > 10000 THEN
        RAISE EXCEPTION 'Unable to allocate a unique profile username for user %', NEW.id
          USING ERRCODE = '23505';
      END IF;
    END;
  END LOOP;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- The email trigger is deliberately paused only during data repair, so old
-- accounts do not receive new-user emails. The migration transaction restores it.
ALTER TABLE public.profiles DISABLE TRIGGER trg_send_welcome_email;

DO $backfill_profiles$
DECLARE
  u record;
  v_full_name text;
  v_avatar text;
  v_base_username text;
  v_username text;
  v_attempt integer;
  v_done boolean;
BEGIN
  FOR u IN
    SELECT
      au.id,
      au.email,
      au.created_at,
      au.raw_user_meta_data,
      p.id AS existing_profile_id,
      p.full_name AS existing_full_name,
      p.profile_photo_url AS existing_avatar
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL OR NULLIF(btrim(p.username), '') IS NULL
    ORDER BY au.created_at, au.id
  LOOP
    v_full_name := COALESCE(
      NULLIF(btrim(u.existing_full_name), ''),
      NULLIF(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(btrim(u.raw_user_meta_data ->> 'name'), ''),
      NULLIF(btrim(split_part(COALESCE(u.email, ''), '@', 1)), ''),
      'Reader'
    );
    v_avatar := COALESCE(
      u.existing_avatar,
      NULLIF(btrim(u.raw_user_meta_data ->> 'avatar_url'), ''),
      NULLIF(btrim(u.raw_user_meta_data ->> 'picture'), ''),
      NULLIF(btrim(u.raw_user_meta_data ->> 'profile_photo_url'), '')
    );
    v_base_username := COALESCE(
      NULLIF(btrim(u.raw_user_meta_data ->> 'username'), ''),
      NULLIF(btrim(split_part(COALESCE(u.email, ''), '@', 1)), ''),
      'reader'
    );
    v_base_username := btrim(
      left(lower(regexp_replace(v_base_username, '[^a-zA-Z0-9_]', '_', 'g')), 40),
      '_'
    );
    IF length(v_base_username) < 3 THEN
      v_base_username := 'reader_' || substr(replace(u.id::text, '-', ''), 1, 8);
    END IF;

    v_attempt := 0;
    v_done := false;
    LOOP
      IF v_attempt = 0 THEN
        v_username := v_base_username;
      ELSIF v_attempt <= 999 THEN
        v_username := left(v_base_username, greatest(3, 50 - length(v_attempt::text) - 1))
                      || '_' || v_attempt::text;
      ELSE
        v_username := left(v_base_username, greatest(1, 50 - 8 - length(v_attempt::text) - 2))
                      || '_' || substr(replace(u.id::text, '-', ''), 1, 8)
                      || '_' || v_attempt::text;
      END IF;

      BEGIN
        INSERT INTO public.profiles AS existing_profile (
          id, full_name, username, profile_photo_url, created_at, updated_at
        )
        VALUES (
          u.id, v_full_name, v_username, v_avatar,
          COALESCE(u.created_at, now()), now()
        )
        ON CONFLICT (id) DO UPDATE
          SET full_name = COALESCE(NULLIF(btrim(existing_profile.full_name), ''), EXCLUDED.full_name),
              username = COALESCE(NULLIF(btrim(existing_profile.username), ''), EXCLUDED.username),
              profile_photo_url = COALESCE(existing_profile.profile_photo_url, EXCLUDED.profile_photo_url),
              updated_at = now();
        v_done := true;
      EXCEPTION WHEN unique_violation THEN
        -- Retry only for a duplicate username; no other data is discarded.
        v_attempt := v_attempt + 1;
        IF v_attempt > 10000 THEN
          RAISE EXCEPTION 'Unable to backfill a unique profile username for user %', u.id
            USING ERRCODE = '23505';
        END IF;
      END;
      EXIT WHEN v_done;
    END LOOP;
  END LOOP;
END;
$backfill_profiles$;

ALTER TABLE public.profiles ENABLE TRIGGER trg_send_welcome_email;

-- Trigger functions are only for trigger execution; never expose them as RPC endpoints.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.send_welcome_email_on_signup() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
