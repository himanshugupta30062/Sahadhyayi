
-- Fix: group_chats UPDATE policy had a self-referencing typo
-- (group_chat_members.group_id = group_chat_members.id) which always evaluated wrong.
DROP POLICY IF EXISTS "Group admins can update group chats" ON public.group_chats;
CREATE POLICY "Group admins can update group chats"
ON public.group_chats
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members gcm
    WHERE gcm.group_id = public.group_chats.id
      AND gcm.user_id = auth.uid()
      AND gcm.role = 'admin'
  )
);

-- Fix: group_chat_members SELECT was too restrictive — members of a group
-- could not see fellow members, breaking member counts and member lists.
DROP POLICY IF EXISTS "Users can view group members" ON public.group_chat_members;
CREATE POLICY "Members can view fellow group members"
ON public.group_chat_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR group_id IN (
    SELECT gcm.group_id FROM public.group_chat_members gcm
    WHERE gcm.user_id = auth.uid()
  )
  OR group_id IN (
    SELECT id FROM public.group_chats WHERE created_by = auth.uid()
  )
);

-- Fix: profiles "Users can view friend profiles" had the same self-reference bug
-- (friends.user1_id = friends.id). Drop it; the other valid friend-visibility
-- policies remain in place.
DROP POLICY IF EXISTS "Users can view friend profiles" ON public.profiles;
