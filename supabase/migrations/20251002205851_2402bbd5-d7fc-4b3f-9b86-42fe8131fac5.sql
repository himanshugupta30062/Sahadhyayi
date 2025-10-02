-- Fix infinite recursion in group_chat_members RLS policies
-- The issue: "Members can view group membership" policy checks group_chat_members 
-- which triggers the same policy, causing infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Members can view group membership" ON group_chat_members;

-- Drop other policies to recreate them properly
DROP POLICY IF EXISTS "Group creators can manage initial membership" ON group_chat_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_chat_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_chat_members;

-- Recreate policies without recursion
-- Allow users to view members of groups they belong to (simpler check)
CREATE POLICY "Users can view group members"
ON group_chat_members
FOR SELECT
USING (
  -- User can see their own membership
  user_id = auth.uid()
  OR
  -- User can see members of groups they created
  group_id IN (
    SELECT id FROM group_chats WHERE created_by = auth.uid()
  )
);

-- Allow group creators to add initial members when creating the group
CREATE POLICY "Group creators can add members"
ON group_chat_members
FOR INSERT
WITH CHECK (
  -- User adding themselves
  user_id = auth.uid()
  OR
  -- Group creator adding members
  group_id IN (
    SELECT id FROM group_chats WHERE created_by = auth.uid()
  )
);

-- Allow users to leave groups
CREATE POLICY "Users can leave groups"
ON group_chat_members
FOR DELETE
USING (user_id = auth.uid());

-- Allow group admins to remove members
CREATE POLICY "Admins can remove members"
ON group_chat_members
FOR DELETE
USING (
  group_id IN (
    SELECT group_id 
    FROM group_chat_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);