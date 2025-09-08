-- Refine avatar access policy to be more secure
-- Remove overly permissive avatar policy and replace with friend-only access

-- Drop the permissive search context policy
DROP POLICY IF EXISTS "Authenticated users can view public avatars in search contexts" ON user_avatars;

-- Keep only the friend-based policy for maximum security
-- Users can only see their own avatars and their friends' avatars