-- Complete the reader profile data path and add persistent favorite books.
-- Profile-private fields remain available only through owner-scoped RPCs.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS life_tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.profiles
SET name = full_name
WHERE name IS NULL AND full_name IS NOT NULL;

ALTER TABLE public.user_bookshelf
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS user_bookshelf_user_favorites_idx
  ON public.user_bookshelf (user_id, added_at DESC)
  WHERE is_favorite IS TRUE;

-- The browser never needs broad SELECT access to private profile fields.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT to_jsonb(p)
  FROM public.profiles AS p
  WHERE p.id = auth.uid()
    AND auth.uid() IS NOT NULL
$function$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Only allow a signed-in user to update their own editable profile fields.
-- The JSON allowlist avoids granting clients direct access to private columns.
CREATE OR REPLACE FUNCTION public.update_my_profile(p_profile jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_gender text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF p_profile IS NULL OR jsonb_typeof(p_profile) <> 'object' THEN
    RAISE EXCEPTION 'Profile payload must be a JSON object' USING ERRCODE = '22023';
  END IF;

  IF p_profile ? 'gender' THEN
    v_gender := NULLIF(lower(btrim(p_profile ->> 'gender')), '');
    IF v_gender IS NOT NULL AND v_gender NOT IN ('male', 'female', 'other') THEN
      RAISE EXCEPTION 'Invalid gender value' USING ERRCODE = '22023';
    END IF;
  ELSE
    v_gender := NULL;
  END IF;

  IF p_profile ? 'life_tags'
     AND jsonb_typeof(p_profile -> 'life_tags') NOT IN ('array', 'null') THEN
    RAISE EXCEPTION 'Life tags must be an array' USING ERRCODE = '22023';
  END IF;

  IF p_profile ? 'social_links'
     AND jsonb_typeof(p_profile -> 'social_links') NOT IN ('object', 'null') THEN
    RAISE EXCEPTION 'Social links must be an object' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.profiles AS current_profile (
    id,
    full_name,
    name,
    username,
    bio,
    dob,
    gender,
    location,
    life_tags,
    social_links,
    profile_photo_url,
    writing_frequency,
    tags_used,
    updated_at
  )
  VALUES (
    v_user_id,
    NULLIF(btrim(COALESCE(p_profile ->> 'full_name', p_profile ->> 'name')), ''),
    NULLIF(btrim(COALESCE(p_profile ->> 'name', p_profile ->> 'full_name')), ''),
    NULLIF(btrim(p_profile ->> 'username'), ''),
    NULLIF(btrim(p_profile ->> 'bio'), ''),
    CASE WHEN p_profile ? 'dob' THEN NULLIF(p_profile ->> 'dob', '')::date ELSE NULL END,
    v_gender,
    NULLIF(btrim(p_profile ->> 'location'), ''),
    CASE
      WHEN jsonb_typeof(p_profile -> 'life_tags') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(p_profile -> 'life_tags'))
      ELSE ARRAY[]::text[]
    END,
    CASE
      WHEN jsonb_typeof(p_profile -> 'social_links') = 'object'
        THEN p_profile -> 'social_links'
      ELSE '{}'::jsonb
    END,
    NULLIF(COALESCE(p_profile ->> 'profile_photo_url', p_profile ->> 'profile_picture_url'), ''),
    NULLIF(p_profile ->> 'writing_frequency', ''),
    COALESCE(
      p_profile -> 'tags_used',
      CASE WHEN p_profile ? 'life_tags' THEN COALESCE(p_profile -> 'life_tags', '[]'::jsonb) ELSE '[]'::jsonb END
    ),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = CASE WHEN p_profile ? 'name' OR p_profile ? 'full_name' THEN EXCLUDED.full_name ELSE current_profile.full_name END,
    name = CASE WHEN p_profile ? 'name' OR p_profile ? 'full_name' THEN EXCLUDED.name ELSE current_profile.name END,
    username = CASE WHEN p_profile ? 'username' THEN EXCLUDED.username ELSE current_profile.username END,
    bio = CASE WHEN p_profile ? 'bio' THEN EXCLUDED.bio ELSE current_profile.bio END,
    dob = CASE WHEN p_profile ? 'dob' THEN EXCLUDED.dob ELSE current_profile.dob END,
    gender = CASE WHEN p_profile ? 'gender' THEN EXCLUDED.gender ELSE current_profile.gender END,
    location = CASE WHEN p_profile ? 'location' THEN EXCLUDED.location ELSE current_profile.location END,
    life_tags = CASE WHEN p_profile ? 'life_tags' OR p_profile ? 'tags_used' THEN EXCLUDED.life_tags ELSE current_profile.life_tags END,
    social_links = CASE WHEN p_profile ? 'social_links' THEN EXCLUDED.social_links ELSE current_profile.social_links END,
    profile_photo_url = CASE WHEN p_profile ? 'profile_photo_url' OR p_profile ? 'profile_picture_url' THEN EXCLUDED.profile_photo_url ELSE current_profile.profile_photo_url END,
    writing_frequency = CASE WHEN p_profile ? 'writing_frequency' THEN EXCLUDED.writing_frequency ELSE current_profile.writing_frequency END,
    tags_used = CASE WHEN p_profile ? 'tags_used' OR p_profile ? 'life_tags' THEN EXCLUDED.tags_used ELSE current_profile.tags_used END,
    updated_at = now()
  RETURNING current_profile.* INTO v_profile;

  RETURN to_jsonb(v_profile);
END;
$function$;

REVOKE ALL ON FUNCTION public.update_my_profile(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile(jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
