-- Reading Groups Phase 1: transactional group lifecycle RPCs.
-- SECURITY DEFINER is used to make multi-table writes atomic despite client RLS.
-- All functions pin search_path, derive identity from auth.uid(), and expose narrow results.

CREATE OR REPLACE FUNCTION public.create_reading_group(
  p_name text,
  p_description text DEFAULT NULL,
  p_visibility text DEFAULT 'public',
  p_join_policy text DEFAULT 'open',
  p_category text DEFAULT NULL,
  p_language_code text DEFAULT NULL,
  p_rules text DEFAULT NULL
)
RETURNS public.group_chats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_group public.group_chats;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF p_name IS NULL OR length(btrim(p_name)) = 0 OR length(btrim(p_name)) > 120 THEN
    RAISE EXCEPTION 'Group name must contain 1-120 characters' USING ERRCODE = '22023';
  END IF;
  IF p_visibility NOT IN ('public', 'private', 'unlisted')
     OR p_join_policy NOT IN ('open', 'approval', 'invite_only') THEN
    RAISE EXCEPTION 'Invalid group visibility or join policy' USING ERRCODE = '22023';
  END IF;
  IF p_visibility = 'private' AND p_join_policy = 'open' THEN
    RAISE EXCEPTION 'Private groups cannot allow open joining' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.group_chats
    (name, description, created_by, visibility, join_policy, category, language_code, rules, is_encrypted)
  VALUES
    (btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''),
     v_user_id, p_visibility, p_join_policy,
     nullif(btrim(coalesce(p_category, '')), ''),
     nullif(btrim(coalesce(p_language_code, '')), ''),
     nullif(btrim(coalesce(p_rules, '')), ''), false)
  RETURNING * INTO v_group;

  INSERT INTO public.group_chat_members (group_id, user_id, role, status)
  VALUES (v_group.id, v_user_id, 'owner', 'active');

  RETURN v_group;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_reading_group(text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_reading_group(text,text,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_or_join_reading_group(p_group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_group public.group_chats;
  v_existing public.group_chat_members;
  v_status text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  SELECT * INTO v_group
  FROM public.group_chats
  WHERE id = p_group_id AND archived_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Group not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_existing
  FROM public.group_chat_members
  WHERE group_id = p_group_id AND user_id = v_user_id;
  IF FOUND THEN
    IF v_existing.status = 'banned' THEN
      RAISE EXCEPTION 'You cannot join this group' USING ERRCODE = '42501';
    END IF;
    RETURN v_existing.status;
  END IF;

  IF v_group.join_policy = 'invite_only' OR
     (v_group.visibility = 'private' AND v_group.join_policy = 'open') THEN
    RAISE EXCEPTION 'A valid invitation is required to join this group' USING ERRCODE = '42501';
  END IF;

  v_status := CASE WHEN v_group.join_policy = 'approval' THEN 'pending' ELSE 'active' END;
  INSERT INTO public.group_chat_members (group_id, user_id, role, status)
  VALUES (p_group_id, v_user_id, 'member', v_status);

  RETURN v_status;
END;
$function$;

REVOKE ALL ON FUNCTION public.request_or_join_reading_group(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_or_join_reading_group(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.leave_reading_group(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_member public.group_chat_members;
  v_owner_count integer;
  v_group_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  -- Serialize owner departures on the group row.
  SELECT name INTO v_group_name
  FROM public.group_chats
  WHERE id = p_group_id AND archived_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Group not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_group_name = 'Sahadhyayi Community Reading Circle' THEN
    RAISE EXCEPTION 'You cannot leave the Sahadhyayi Community Reading Circle' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_member
  FROM public.group_chat_members
  WHERE group_id = p_group_id AND user_id = v_user_id AND status = 'active';
  IF NOT FOUND THEN RETURN; END IF;

  IF v_member.role = 'owner' THEN
    SELECT count(*) INTO v_owner_count
    FROM public.group_chat_members
    WHERE group_id = p_group_id AND status = 'active' AND role = 'owner';
    IF v_owner_count <= 1 THEN
      RAISE EXCEPTION 'Transfer ownership before leaving this group' USING ERRCODE = '42501';
    END IF;
  END IF;

  DELETE FROM public.group_chat_members
  WHERE group_id = p_group_id AND user_id = v_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.leave_reading_group(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_reading_group(uuid) TO authenticated;

COMMENT ON FUNCTION public.create_reading_group(text,text,text,text,text,text,text) IS
  'Atomically creates a reading group and active owner membership for auth.uid().';
COMMENT ON FUNCTION public.request_or_join_reading_group(uuid) IS
  'Enforces group join policy and creates active or pending membership for auth.uid().';
COMMENT ON FUNCTION public.leave_reading_group(uuid) IS
  'Allows self-leave while protecting the default circle and the last active owner.';
