-- Fix group_chats visibility policies
-- Users should be able to view all groups, not just ones they're members of

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Group members can view group chats" ON group_chats;

-- Create new policy to allow everyone to see all groups
CREATE POLICY "Anyone can view all groups"
ON group_chats
FOR SELECT
USING (true);

-- Keep the existing insert policy for authenticated users
-- Keep the existing update policy for admins

-- Verify group_chat_members policies are working correctly
-- These were fixed earlier to prevent infinite recursion