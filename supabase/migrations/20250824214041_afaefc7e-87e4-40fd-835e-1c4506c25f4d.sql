-- Fix critical security vulnerability: Remove public access to user profiles
-- and implement proper privacy controls

-- First, drop the dangerous policy that allows all authenticated users to view all profiles
DROP POLICY IF EXISTS "Authenticated users can view limited profile info for search" ON public.profiles;

-- Create a new secure policy for search that only exposes safe, non-sensitive fields
-- This policy will be used by a security definer function to limit data exposure
CREATE OR REPLACE FUNCTION public.get_public_profiles_for_search(search_term text DEFAULT ''::text)
RETURNS TABLE(id uuid, username text, full_name text, bio text, profile_photo_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Ensure the user_profile table has proper RLS enabled
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- Drop existing overly broad policies on user_profile if any
DROP POLICY IF EXISTS "Users can manage own user_profile" ON public.user_profile;

-- Create secure policies for user_profile table
CREATE POLICY "Users can view their own profile" 
ON public.user_profile 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profile 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.user_profile 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
ON public.user_profile 
FOR DELETE 
USING (auth.uid() = id);

-- Create a secure function for friends to view limited profile info
CREATE OR REPLACE FUNCTION public.get_friend_profile_info(friend_user_id uuid)
RETURNS TABLE(
  id uuid, 
  name text, 
  username text, 
  bio text, 
  profile_picture_url text, 
  location text,
  joined_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the requesting user is friends with the target user
  IF NOT EXISTS (
    SELECT 1 FROM friends 
    WHERE ((user1_id = auth.uid() AND user2_id = friend_user_id) OR
           (user2_id = auth.uid() AND user1_id = friend_user_id))
  ) AND auth.uid() != friend_user_id THEN
    -- If not friends and not own profile, return limited info only
    RETURN QUERY
    SELECT 
      up.id,
      up.name,
      up.username,
      LEFT(COALESCE(up.bio, ''), 50) || CASE WHEN LENGTH(COALESCE(up.bio, '')) > 50 THEN '...' ELSE '' END as bio,
      up.profile_picture_url,
      NULL::text as location,  -- Don't expose location to non-friends
      up.joined_at
    FROM user_profile up
    WHERE up.id = friend_user_id;
  ELSE
    -- If friends or own profile, return more detailed info (but still not sensitive data)
    RETURN QUERY
    SELECT 
      up.id,
      up.name,
      up.username,
      up.bio,
      up.profile_picture_url,
      up.location,
      up.joined_at
    FROM user_profile up
    WHERE up.id = friend_user_id;
  END IF;
END;
$$;

-- Add comment for security documentation
COMMENT ON FUNCTION public.get_public_profiles_for_search(text) IS 
'Security function to safely expose limited profile data for search without leaking sensitive information';

COMMENT ON FUNCTION public.get_friend_profile_info(uuid) IS 
'Security function to provide profile information based on friendship status, protecting sensitive data';