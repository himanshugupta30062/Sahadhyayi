-- Owner-scoped avatar access. The app no longer relies on direct
-- user_avatars table reads/writes, which were returning 403 in production.
CREATE OR REPLACE FUNCTION public.get_my_avatar()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT jsonb_build_object(
    'id', ua.id,
    'user_id', ua.user_id,
    'avatar_json', ua.avatar_json,
    'avatar_img_url', ua.avatar_img_url,
    'created_at', ua.created_at,
    'updated_at', ua.updated_at
  )
  FROM public.user_avatars AS ua
  WHERE ua.user_id = auth.uid()
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_my_avatar() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_avatar() TO authenticated;

CREATE OR REPLACE FUNCTION public.save_my_avatar(
  p_avatar_json jsonb,
  p_avatar_img_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_avatar public.user_avatars%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF p_avatar_json IS NULL OR jsonb_typeof(p_avatar_json) <> 'object'
     OR octet_length(p_avatar_json::text) > 20000 THEN
    RAISE EXCEPTION 'Avatar settings are invalid or too large' USING ERRCODE = '22023';
  END IF;

  IF p_avatar_img_url IS NULL OR length(p_avatar_img_url) > 160000
     OR NOT (
       p_avatar_img_url ~ '^data:image/svg\+xml;base64,[A-Za-z0-9+/]+={0,2}$'
       OR p_avatar_img_url ~ '^https://'
     ) THEN
    RAISE EXCEPTION 'Avatar image must be an SVG data image or an HTTPS URL' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.user_avatars (
    user_id,
    avatar_json,
    avatar_img_url,
    updated_at
  )
  VALUES (
    v_user_id,
    p_avatar_json,
    p_avatar_img_url,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    avatar_json = EXCLUDED.avatar_json,
    avatar_img_url = EXCLUDED.avatar_img_url,
    updated_at = now()
  RETURNING * INTO v_avatar;

  RETURN jsonb_build_object(
    'id', v_avatar.id,
    'user_id', v_avatar.user_id,
    'avatar_json', v_avatar.avatar_json,
    'avatar_img_url', v_avatar.avatar_img_url,
    'created_at', v_avatar.created_at,
    'updated_at', v_avatar.updated_at
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.save_my_avatar(jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_my_avatar(jsonb, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
