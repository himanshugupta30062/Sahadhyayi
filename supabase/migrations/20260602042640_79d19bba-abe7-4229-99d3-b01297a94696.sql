
-- Restrict content_feedback reads to owner (and admins)
DROP POLICY IF EXISTS "Users can view all feedback" ON public.content_feedback;
CREATE POLICY "Users can view their own feedback"
ON public.content_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- Remove broad leaderboard/badges read; leaderboard uses SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Authenticated users can view badges" ON public.user_game_badges;
DROP POLICY IF EXISTS "Authenticated users can view leaderboard" ON public.user_game_stats;
