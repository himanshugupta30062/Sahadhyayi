
-- Fix broken SELECT policy on chat_rooms
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can view their chat rooms"
ON public.chat_rooms FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.chat_room_id = chat_rooms.id
      AND chat_participants.user_id = auth.uid()
  )
);

-- Fix broken UPDATE policy on chat_rooms
DROP POLICY IF EXISTS "Chat admins can update rooms" ON public.chat_rooms;
CREATE POLICY "Chat admins can update rooms"
ON public.chat_rooms FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.chat_room_id = chat_rooms.id
      AND chat_participants.user_id = auth.uid()
      AND chat_participants.is_admin = true
  )
);
