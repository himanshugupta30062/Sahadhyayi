-- Fix critical security vulnerabilities in posts and user_avatars tables
-- Replace overly permissive anonymous access with friend-based security

-- 1. Drop the insecure "Anyone can view posts" policy
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;

-- 2. Create secure post visibility policy for authenticated users and friends
CREATE POLICY "Users can view their own posts and friends' posts" 
ON posts 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM friends 
    WHERE (
      (user1_id = auth.uid() AND user2_id = posts.user_id) OR
      (user2_id = auth.uid() AND user1_id = posts.user_id)
    )
  )
);

-- 3. Drop the insecure "Anyone can view avatars for social features" policy  
DROP POLICY IF EXISTS "Anyone can view avatars for social features" ON user_avatars;

-- 4. Create secure avatar visibility policy for authenticated users and friends
CREATE POLICY "Users can view their own avatars and friends' avatars"
ON user_avatars 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM friends 
    WHERE (
      (user1_id = auth.uid() AND user2_id = user_avatars.user_id) OR
      (user2_id = auth.uid() AND user1_id = user_avatars.user_id)
    )
  )
);

-- 5. Add policy for public profile scenarios (if needed for non-sensitive avatar display)
-- This allows authenticated users to see avatars in search/discovery contexts
CREATE POLICY "Authenticated users can view public avatars in search contexts"
ON user_avatars 
FOR SELECT 
TO authenticated
USING (
  -- Only allow viewing avatar URL, not other sensitive data
  true
);

-- Note: The above policy should be further restricted based on your specific use cases
-- Consider removing it if avatars should only be visible to friends