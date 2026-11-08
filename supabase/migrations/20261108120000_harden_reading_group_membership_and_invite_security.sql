-- Security Hardening (Phase 1): Prevent unauthorized self-join to invite-only reading groups.
-- The UI and group_chats schema use is_encrypted as the invite-only flag.
-- 1. Public reading groups (is_encrypted IS NOT TRUE): Any authenticated reader can join as a member.
-- 2. Invite-only reading groups (is_encrypted IS TRUE): Non-members cannot self-join directly via PostgREST.
--    Only existing group admins/creators can add members.
-- 3. Group creators can add themselves as the initial group admin during group creation.

DROP POLICY IF EXISTS "Authenticated users can join reading groups" ON public.group_chat_members;
DROP POLICY IF EXISTS "Authenticated users can join public reading groups" ON public.group_chat_members;

CREATE POLICY "Authenticated users can join public reading groups"
  ON public.group_chat_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND role = 'member'
    AND EXISTS (
      SELECT 1
      FROM public.group_chats AS gc
      WHERE gc.id = group_chat_members.group_id
        AND gc.is_encrypted IS NOT TRUE
    )
  );

DROP POLICY IF EXISTS "Group admins can add members" ON public.group_chat_members;
CREATE POLICY "Group admins can add members"
  ON public.group_chat_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.group_chat_members AS admin_member
      WHERE admin_member.group_id = group_chat_members.group_id
        AND admin_member.user_id = (SELECT auth.uid())
        AND admin_member.role = 'admin'
    )
    OR EXISTS (
      SELECT 1
      FROM public.group_chats AS gc
      WHERE gc.id = group_chat_members.group_id
        AND gc.created_by = (SELECT auth.uid())
    )
  );

COMMENT ON POLICY "Authenticated users can join public reading groups" ON public.group_chat_members IS
  'Allows readers to self-join public reading groups. Invite-only groups require an admin or creator to add members.';

COMMENT ON POLICY "Group admins can add members" ON public.group_chat_members IS
  'Allows group creators and admins to add members to their reading groups, including invite-only circles.';

