-- Centralized role management RPCs. The live migration was applied to Sahadhyayi.
CREATE OR REPLACE FUNCTION public.admin_list_user_roles()
RETURNS TABLE(user_id uuid, email text, role text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator permission required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT ur.user_id, u.email::text, ur.role, ur.created_at
  FROM public.user_roles AS ur JOIN auth.users AS u ON u.id = ur.user_id
  ORDER BY ur.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_email text, p_role text, p_grant boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  target_user_id uuid;
  normalized_email text := lower(trim(p_email));
  admin_count bigint;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator permission required' USING ERRCODE = '42501';
  END IF;
  IF normalized_email IS NULL OR normalized_email = '' OR length(normalized_email) > 320 THEN
    RAISE EXCEPTION 'A valid email is required' USING ERRCODE = '22023';
  END IF;
  IF p_role NOT IN ('admin', 'moderator', 'editor', 'support') THEN
    RAISE EXCEPTION 'Unsupported role' USING ERRCODE = '22023';
  END IF;
  SELECT id INTO target_user_id FROM auth.users WHERE lower(email) = normalized_email LIMIT 1;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No registered account found for that email' USING ERRCODE = 'P0002';
  END IF;
  IF p_grant THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (target_user_id, p_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    IF p_role = 'admin' AND target_user_id = auth.uid() THEN
      RAISE EXCEPTION 'You cannot remove your own administrator role' USING ERRCODE = '42501';
    END IF;
    IF p_role = 'admin' THEN
      SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
      IF admin_count <= 1 AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Cannot remove the last administrator' USING ERRCODE = '42501';
      END IF;
    END IF;
    DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = p_role;
  END IF;
  RETURN jsonb_build_object('success', true, 'email', normalized_email, 'role', p_role, 'granted', p_grant);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_user_roles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_role(text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_user_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(text, text, boolean) TO authenticated;
