
-- 1. Fix friends table: restrict INSERT to require auth.uid() match
DROP POLICY IF EXISTS "System can create friendships" ON public.friends;
CREATE POLICY "Users can create friendships they belong to"
  ON public.friends FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 2. Fix chat_participants SELECT tautology
DROP POLICY IF EXISTS "Users can view chat participants" ON public.chat_participants;
CREATE POLICY "Users can view participants in their chat rooms"
  ON public.chat_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR chat_room_id IN (
      SELECT cp2.chat_room_id FROM public.chat_participants cp2 WHERE cp2.user_id = auth.uid()
    )
  );

-- 3. Fix profiles public exposure: drop overly permissive SELECT policies
DROP POLICY IF EXISTS "Anyone can view basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view basic profiles" ON public.profiles;

-- Authenticated users can view all profiles
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
