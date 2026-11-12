-- Security: remove the overly permissive self-membership/creator INSERT policy.
-- Public group self-join remains covered by "Authenticated users can join public reading groups".
-- Creator/admin invitations remain covered by "Group admins can add members" (which explicitly
-- checks group admin membership or group_chats.created_by).
DROP POLICY IF EXISTS "Group creators can add members" ON public.group_chat_members;
