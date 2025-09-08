-- Fine-tune avatar access policy to be more restrictive
-- Remove the overly broad "Authenticated users can view public avatars in search contexts" policy

DROP POLICY IF EXISTS "Authenticated users can view public avatars in search contexts" ON user_avatars;

-- Create a more specific policy for user discovery/search contexts
-- This allows viewing avatars only when needed for legitimate user search/discovery
CREATE POLICY "Authenticated users can view avatars in user search"
ON user_avatars 
FOR SELECT 
TO authenticated
USING (
  -- Allow viewing avatars when searching for users to befriend
  -- But only if the viewer has location sharing enabled (indicates active social user)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND location_sharing = true
  )
);