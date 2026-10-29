-- Granular role permissions for Sahadhyayi.
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role text NOT NULL CHECK (role IN ('moderator','editor','support')),
  permission text NOT NULL CHECK (permission IN ('community.moderate','content.edit','content.publish','feedback.manage','users.support')),
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (role, permission)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.role_permissions FROM PUBLIC, anon, authenticated;
INSERT INTO public.role_permissions(role,permission,enabled) VALUES
('moderator','community.moderate',false),('moderator','feedback.manage',false),
('editor','content.edit',false),('editor','content.publish',false),
('support','feedback.manage',false),('support','users.support',false)
ON CONFLICT (role,permission) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_list_role_permissions()
RETURNS TABLE(role text,permission text,enabled boolean,updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator permission required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT rp.role,rp.permission,rp.enabled,rp.updated_at FROM public.role_permissions rp ORDER BY rp.role,rp.permission;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_role_permission(p_role text,p_permission text,p_enabled boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator permission required' USING ERRCODE='42501'; END IF;
 IF p_role NOT IN ('moderator','editor','support') OR p_permission NOT IN ('community.moderate','content.edit','content.publish','feedback.manage','users.support') THEN
   RAISE EXCEPTION 'Unsupported role or permission' USING ERRCODE='22023';
 END IF;
 INSERT INTO public.role_permissions(role,permission,enabled,updated_at,updated_by) VALUES(p_role,p_permission,p_enabled,now(),auth.uid())
 ON CONFLICT(role,permission) DO UPDATE SET enabled=EXCLUDED.enabled,updated_at=now(),updated_by=auth.uid();
 RETURN jsonb_build_object('success',true,'role',p_role,'permission',p_permission,'enabled',p_enabled);
END; $$;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
 SELECT CASE WHEN auth.uid() IS NULL THEN false WHEN public.is_admin() THEN true
 ELSE EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.role_permissions rp ON rp.role=ur.role
 WHERE ur.user_id=auth.uid() AND rp.permission=p_permission AND rp.enabled=true) END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_role_permissions() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_set_role_permission(text,text,boolean) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.has_permission(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_list_role_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role_permission(text,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO authenticated;