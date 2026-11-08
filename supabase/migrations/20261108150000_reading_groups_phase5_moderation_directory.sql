-- Reading Groups Phase 5: moderator-only membership directory for the management UI.
-- Pending and banned membership details are never exposed through a public list query.
-- Older groups predate the explicit owner role; their active creator/admin becomes owner
-- when no active owner is already assigned, preserving the original group steward.

UPDATE public.group_chat_members AS creator_membership
SET role = 'owner'
FROM public.group_chats AS group_row
WHERE creator_membership.group_id = group_row.id
  AND creator_membership.user_id = group_row.created_by
  AND creator_membership.role = 'admin'
  AND creator_membership.status = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM public.group_chat_members AS existing_owner
    WHERE existing_owner.group_id = creator_membership.group_id
      AND existing_owner.role = 'owner'
      AND existing_owner.status = 'active'
  );

CREATE OR REPLACE FUNCTION public.get_reading_group_moderation_members(p_group_id uuid)
RETURNS TABLE (
  membership_id uuid,
  user_id uuid,
  role text,
  status text,
  joined_at timestamptz,
  full_name text,
  username text,
  profile_photo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF p_group_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.group_chat_members AS actor_membership
    WHERE actor_membership.group_id = p_group_id
      AND actor_membership.user_id = v_actor
      AND actor_membership.status = 'active'
      AND actor_membership.role IN ('owner', 'admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Active group moderator permission required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    membership.id,
    membership.user_id,
    membership.role,
    membership.status,
    membership.joined_at,
    profile.full_name,
    profile.username,
    profile.profile_photo_url
  FROM public.group_chat_members AS membership
  LEFT JOIN public.profiles AS profile
    ON profile.id = membership.user_id
  WHERE membership.group_id = p_group_id
  ORDER BY
    CASE membership.status
      WHEN 'pending' THEN 0
      WHEN 'active' THEN 1
      ELSE 2
    END,
    membership.joined_at ASC NULLS LAST;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_reading_group_moderation_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_reading_group_moderation_members(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_reading_group_moderation_members(uuid) IS
  'Returns group membership details only to an active owner, admin, or moderator for moderation UI.';
