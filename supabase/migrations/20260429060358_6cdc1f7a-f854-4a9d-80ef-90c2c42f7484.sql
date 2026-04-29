-- Allow group creators to update and delete their own group_chats
CREATE POLICY "Creators can update their group chats"
ON public.group_chats
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can delete their group chats"
ON public.group_chats
FOR DELETE
TO authenticated
USING (created_by = auth.uid());