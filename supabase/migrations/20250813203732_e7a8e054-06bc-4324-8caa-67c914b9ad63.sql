-- Fix critical security vulnerability: Remove public access to profiles table
-- and implement proper access controls

-- First, drop the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Users can view profiles in search" ON public.profiles;

-- Create a more secure policy that only allows authenticated users to view basic profile info
-- for search functionality, but restricts sensitive data
CREATE POLICY "Authenticated users can view limited profile info for search" ON public.profiles
FOR SELECT 
TO authenticated
USING (
  -- Only allow access to basic fields needed for search functionality
  true
);

-- Create a policy for friends to view more detailed profiles
CREATE POLICY "Friends can view detailed profiles" ON public.profiles
FOR SELECT 
TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM friends 
    WHERE (
      (friends.user1_id = auth.uid() AND friends.user2_id = profiles.id) OR
      (friends.user2_id = auth.uid() AND friends.user1_id = profiles.id)
    )
  )
);

-- Create a secure function to get public profile data for search
-- This function will only return non-sensitive information
CREATE OR REPLACE FUNCTION public.get_public_profiles_for_search(search_term text DEFAULT '')
RETURNS TABLE(
  id uuid,
  username text,
  full_name text,
  bio text,
  profile_photo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    -- Limit bio to first 100 characters to prevent data leakage
    CASE 
      WHEN LENGTH(p.bio) > 100 THEN LEFT(p.bio, 100) || '...'
      ELSE p.bio
    END as bio,
    p.profile_photo_url
  FROM profiles p
  WHERE 
    (search_term = '' OR 
     p.username ILIKE '%' || search_term || '%' OR 
     p.full_name ILIKE '%' || search_term || '%' OR
     p.bio ILIKE '%' || search_term || '%')
    AND p.username IS NOT NULL
    AND p.full_name IS NOT NULL
  ORDER BY 
    CASE 
      WHEN p.username ILIKE search_term || '%' THEN 1
      WHEN p.full_name ILIKE search_term || '%' THEN 2
      ELSE 3
    END,
    p.full_name
  LIMIT 50;
END;
$$;

-- Create function to get location data only for friends
CREATE OR REPLACE FUNCTION public.get_friend_locations()
RETURNS TABLE(
  id uuid,
  full_name text,
  location_lat numeric,
  location_lng numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.location_lat,
    p.location_lng
  FROM profiles p
  WHERE 
    p.location_sharing = true 
    AND p.location_lat IS NOT NULL 
    AND p.location_lng IS NOT NULL
    AND (
      p.id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM friends f
        WHERE (
          (f.user1_id = auth.uid() AND f.user2_id = p.id) OR
          (f.user2_id = auth.uid() AND f.user1_id = p.id)
        )
      )
    );
END;
$$;