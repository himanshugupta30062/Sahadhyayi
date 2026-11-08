-- Reading Groups Phase 3: invitation redemption and membership moderation.
-- Raw invite tokens are high-entropy bearer credentials; only SHA-256 digests are stored.
-- All mutating functions derive the caller from auth.uid() and use a fixed search_path.

CREATE OR REPLACE FUNCTION public.create_reading_group_invitation(
  p_group_id uuid,
  p_token text,
  p_expires_at timestamptz,
  p_max_uses integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_invitation_id uuid;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
  IF p_token IS NULL OR length(p_token) < 32 OR length(p_token) > 256 THEN
    RAISE EXCEPTION 'Invitation token must be a high-entropy credential' USING ERRCODE = '22023';
  END IF;
  IF p_expires_at IS NULL OR p_expires_at <= now() OR p_expires_at > now() + interval '90 days' THEN
    RAISE EXCEPTION 'Invitation expiry must be within the next 90 days' USING ERRCODE = '22023';
  END IF;
  IF p_max_uses IS NOT NULL AND p_max_uses < 1 THEN
    RAISE EXCEPTION 'Maximum uses must be positive' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_id = p_group_id AND user_id = v_actor AND status = 'active'
      AND role IN ('owner','admin','moderator')
  ) THEN
    RAISE EXCEPTION 'Only active group moderators can create invitations' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.group_invitations(group_id, inviter_id, token_hash, expires_at, max_uses)
  VALUES (p_group_id, v_actor,
    encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex'),
    p_expires_at, p_max_uses)
  RETURNING id INTO v_invitation_id;
  RETURN v_invitation_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_reading_group_invitation(uuid,text,timestamptz,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_reading_group_invitation(uuid,text,timestamptz,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_reading_group_invitation(p_token text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_inv public.group_invitations;
  v_group public.group_chats;
  v_member public.group_chat_members;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
  IF p_token IS NULL OR length(p_token) < 32 OR length(p_token) > 256 THEN
    RAISE EXCEPTION 'Invalid invitation' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_inv
  FROM public.group_invitations
  WHERE token_hash = encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex')
  FOR UPDATE;
  IF NOT FOUND OR v_inv.revoked_at IS NOT NULL OR v_inv.expires_at <= now()
     OR (v_inv.max_uses IS NOT NULL AND v_inv.uses_count >= v_inv.max_uses) THEN
    RAISE EXCEPTION 'Invitation is invalid, expired, revoked, or exhausted' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_group FROM public.group_chats WHERE id = v_inv.group_id AND archived_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Group is unavailable' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO v_member FROM public.group_chat_members
  WHERE group_id = v_inv.group_id AND user_id = v_actor;
  IF FOUND THEN
    IF v_member.status = 'banned' THEN RAISE EXCEPTION 'You cannot join this group' USING ERRCODE = '42501'; END IF;
    IF v_member.status = 'active' THEN RETURN 'active'; END IF;
    UPDATE public.group_chat_members SET status = 'active'
    WHERE group_id = v_inv.group_id AND user_id = v_actor;
  ELSE
    INSERT INTO public.group_chat_members(group_id,user_id,role,status)
    VALUES(v_inv.group_id,v_actor,'member','active');
  END IF;

  UPDATE public.group_invitations SET uses_count = uses_count + 1 WHERE id = v_inv.id;
  RETURN 'active';
END;
$function$;

REVOKE ALL ON FUNCTION public.redeem_reading_group_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_reading_group_invitation(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.moderate_reading_group_member(
  p_group_id uuid,
  p_user_id uuid,
  p_action text
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_target public.group_chat_members;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
  IF p_action NOT IN ('approve','reject','ban','unban') THEN
    RAISE EXCEPTION 'Unsupported moderation action' USING ERRCODE = '22023';
  END IF;

  SELECT role INTO v_actor_role FROM public.group_chat_members
  WHERE group_id = p_group_id AND user_id = v_actor AND status = 'active';
  IF v_actor_role NOT IN ('owner','admin','moderator') OR v_actor_role IS NULL THEN
    RAISE EXCEPTION 'Moderator permission required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_target FROM public.group_chat_members
  WHERE group_id = p_group_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Membership not found' USING ERRCODE = 'P0002'; END IF;
  IF v_target.role = 'owner' THEN RAISE EXCEPTION 'Owner membership cannot be moderated' USING ERRCODE = '42501'; END IF;
  IF v_actor_role = 'moderator' AND v_target.role IN ('admin','owner') THEN
    RAISE EXCEPTION 'Moderators cannot moderate administrators' USING ERRCODE = '42501';
  END IF;

  IF p_action = 'approve' THEN
    IF v_target.status <> 'pending' THEN RAISE EXCEPTION 'Only pending requests can be approved' USING ERRCODE = '22023'; END IF;
    UPDATE public.group_chat_members SET status='active' WHERE group_id=p_group_id AND user_id=p_user_id;
    RETURN 'active';
  ELSIF p_action = 'reject' THEN
    IF v_target.status <> 'pending' THEN RAISE EXCEPTION 'Only pending requests can be rejected' USING ERRCODE = '22023'; END IF;
    DELETE FROM public.group_chat_members WHERE group_id=p_group_id AND user_id=p_user_id;
    RETURN 'removed';
  ELSIF p_action = 'ban' THEN
    UPDATE public.group_chat_members SET status='banned' WHERE group_id=p_group_id AND user_id=p_user_id;
    RETURN 'banned';
  ELSE
    IF v_target.status <> 'banned' THEN RAISE EXCEPTION 'Member is not banned' USING ERRCODE = '22023'; END IF;
    UPDATE public.group_chat_members SET status='active' WHERE group_id=p_group_id AND user_id=p_user_id;
    RETURN 'active';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.moderate_reading_group_member(uuid,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_reading_group_member(uuid,uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_reading_group_member_role(
  p_group_id uuid,
  p_user_id uuid,
  p_role text
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_target public.group_chat_members;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
  IF p_role NOT IN ('admin','moderator','member') THEN
    RAISE EXCEPTION 'Role must be admin, moderator, or member; ownership uses transfer' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.group_chat_members
    WHERE group_id=p_group_id AND user_id=v_actor AND status='active' AND role='owner') THEN
    RAISE EXCEPTION 'Only the owner can change member roles' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_target FROM public.group_chat_members
  WHERE group_id=p_group_id AND user_id=p_user_id AND status='active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active membership not found' USING ERRCODE = 'P0002'; END IF;
  IF v_target.role='owner' THEN RAISE EXCEPTION 'Transfer ownership instead of changing owner role' USING ERRCODE = '42501'; END IF;
  UPDATE public.group_chat_members SET role=p_role WHERE group_id=p_group_id AND user_id=p_user_id;
  RETURN p_role;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_reading_group_member_role(uuid,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_reading_group_member_role(uuid,uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.transfer_reading_group_ownership(
  p_group_id uuid,
  p_new_owner_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
  PERFORM 1 FROM public.group_chats WHERE id=p_group_id AND archived_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Group not found' USING ERRCODE = 'P0002'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.group_chat_members
    WHERE group_id=p_group_id AND user_id=v_actor AND status='active' AND role='owner') THEN
    RAISE EXCEPTION 'Only the owner can transfer ownership' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.group_chat_members
    WHERE group_id=p_group_id AND user_id=p_new_owner_id AND status='active') THEN
    RAISE EXCEPTION 'New owner must be an active member' USING ERRCODE = '22023';
  END IF;
  UPDATE public.group_chat_members SET role='admin'
  WHERE group_id=p_group_id AND user_id=v_actor;
  UPDATE public.group_chat_members SET role='owner'
  WHERE group_id=p_group_id AND user_id=p_new_owner_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.transfer_reading_group_ownership(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_reading_group_ownership(uuid,uuid) TO authenticated;
