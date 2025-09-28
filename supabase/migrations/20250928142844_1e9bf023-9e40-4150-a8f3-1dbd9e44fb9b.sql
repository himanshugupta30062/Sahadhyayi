-- Fix infinite recursion in group_chat_members RLS policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Group admins can manage membership" ON public.group_chat_members;
DROP POLICY IF EXISTS "Group members can view group membership" ON public.group_chat_members;

-- Create corrected policies
-- Allow users to view group membership for groups they belong to
CREATE POLICY "Members can view group membership" 
ON public.group_chat_members 
FOR SELECT 
USING (
  group_id IN (
    SELECT gcm.group_id 
    FROM public.group_chat_members gcm 
    WHERE gcm.user_id = auth.uid()
  )
);

-- Allow group creators to manage membership initially
CREATE POLICY "Group creators can manage initial membership" 
ON public.group_chat_members 
FOR ALL 
USING (
  group_id IN (
    SELECT gc.id 
    FROM public.group_chats gc 
    WHERE gc.created_by = auth.uid()
  )
)
WITH CHECK (
  group_id IN (
    SELECT gc.id 
    FROM public.group_chats gc 
    WHERE gc.created_by = auth.uid()
  )
);

-- Allow users to join groups (insert their own membership)
CREATE POLICY "Users can join groups" 
ON public.group_chat_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Allow users to leave groups (delete their own membership)
CREATE POLICY "Users can leave groups" 
ON public.group_chat_members 
FOR DELETE 
USING (user_id = auth.uid());