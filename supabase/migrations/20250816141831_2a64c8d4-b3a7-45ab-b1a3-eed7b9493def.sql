-- CRITICAL SECURITY FIX: Protect user location data from stalkers and unauthorized access

-- First, let's see what location data tables we have and their current state
-- and implement comprehensive location privacy protection

-- 1. Fix the readers table security (currently publicly readable - MAJOR SECURITY RISK)
-- Drop the dangerous public access policy
DROP POLICY IF EXISTS "Anyone can view shared reading locations" ON public.readers;

-- Create secure location access policies for readers table
-- Only show to authenticated users who have explicit permission
CREATE POLICY "Users can view location from friends only" ON public.readers
FOR SELECT USING (
  -- Allow user to see their own location
  auth.uid() = user_id OR
  -- Allow friends to see location only if both users have location sharing enabled
  (EXISTS (
    SELECT 1 FROM public.friends f
    JOIN public.profiles p1 ON p1.id = auth.uid()
    JOIN public.profiles p2 ON p2.id = readers.user_id
    WHERE ((f.user1_id = auth.uid() AND f.user2_id = readers.user_id) OR
           (f.user2_id = auth.uid() AND f.user1_id = readers.user_id))
    AND p1.location_sharing = true 
    AND p2.location_sharing = true
  ))
);

-- 2. Create a secure function to get nearby readers (replacing any public access)
CREATE OR REPLACE FUNCTION public.get_nearby_readers(radius_km numeric DEFAULT 10)
RETURNS TABLE(
  reader_id uuid,
  reader_name text,
  book_title text,
  distance_km numeric,
  is_friend boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_lat numeric;
  user_lng numeric;
BEGIN
  -- Get current user's location
  SELECT location_lat, location_lng INTO user_lat, user_lng
  FROM public.profiles 
  WHERE id = auth.uid() AND location_sharing = true;
  
  -- If user doesn't have location or hasn't enabled sharing, return empty
  IF user_lat IS NULL OR user_lng IS NULL THEN
    RETURN;
  END IF;
  
  -- Return only readers who are friends and have location sharing enabled
  RETURN QUERY
  SELECT 
    r.user_id as reader_id,
    r.name as reader_name,
    r.book as book_title,
    -- Calculate distance using Haversine formula
    (6371 * acos(cos(radians(user_lat)) * cos(radians(r.lat)) * 
                cos(radians(r.lng) - radians(user_lng)) + 
                sin(radians(user_lat)) * sin(radians(r.lat)))) as distance_km,
    true as is_friend
  FROM public.readers r
  JOIN public.friends f ON (
    (f.user1_id = auth.uid() AND f.user2_id = r.user_id) OR
    (f.user2_id = auth.uid() AND f.user1_id = r.user_id)
  )
  JOIN public.profiles p ON p.id = r.user_id
  WHERE p.location_sharing = true
  AND r.user_id != auth.uid()
  AND (6371 * acos(cos(radians(user_lat)) * cos(radians(r.lat)) * 
                  cos(radians(r.lng) - radians(user_lng)) + 
                  sin(radians(user_lat)) * sin(radians(r.lat)))) <= radius_km
  ORDER BY distance_km;
END;
$$;

-- 3. Update the get_friend_locations function to be more secure
-- (This was already created in the previous migration but let's ensure it's properly secured)
CREATE OR REPLACE FUNCTION public.get_friend_locations()
RETURNS TABLE(id uuid, full_name text, location_lat numeric, location_lng numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only return friends' locations if both users have location sharing enabled
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.location_lat,
    p.location_lng
  FROM profiles p
  JOIN friends f ON (
    (f.user1_id = auth.uid() AND f.user2_id = p.id) OR
    (f.user2_id = auth.uid() AND f.user1_id = p.id)
  )
  JOIN profiles current_user ON current_user.id = auth.uid()
  WHERE 
    p.location_sharing = true 
    AND current_user.location_sharing = true
    AND p.location_lat IS NOT NULL 
    AND p.location_lng IS NOT NULL
    AND p.id != auth.uid();
END;
$$;

-- 4. Create a function for admin analytics without exposing individual locations
CREATE OR REPLACE FUNCTION public.get_location_analytics()
RETURNS TABLE(
  total_sharing_users BIGINT,
  active_readers BIGINT,
  countries_represented BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow admins to access this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE location_sharing = true AND location_lat IS NOT NULL) as total_sharing_users,
    COUNT(DISTINCT r.user_id) as active_readers,
    COUNT(DISTINCT substring(p.location_lat::text, 1, 1)) as countries_represented -- Very rough approximation
  FROM public.profiles p
  LEFT JOIN public.readers r ON r.user_id = p.id;
END;
$$;

-- 5. Add additional security: location sharing confirmation
-- Create a table to track location sharing consent with timestamp
CREATE TABLE IF NOT EXISTS public.location_sharing_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consented_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id)
);

-- Enable RLS on consent table
ALTER TABLE public.location_sharing_consent ENABLE ROW LEVEL SECURITY;

-- Users can only see their own consent
CREATE POLICY "Users can view own consent" ON public.location_sharing_consent
FOR ALL USING (user_id = auth.uid());

-- 6. Create function to record location sharing consent
CREATE OR REPLACE FUNCTION public.record_location_consent(
  ip_addr inet DEFAULT NULL,
  user_agent_string text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.location_sharing_consent (user_id, ip_address, user_agent)
  VALUES (auth.uid(), ip_addr, user_agent_string)
  ON CONFLICT (user_id) DO UPDATE SET
    consented_at = now(),
    ip_address = EXCLUDED.ip_address,
    user_agent = EXCLUDED.user_agent;
    
  -- Also enable location sharing in profiles
  UPDATE public.profiles 
  SET location_sharing = true 
  WHERE id = auth.uid();
END;
$$;

-- 7. Update profiles table policies to be more restrictive with location data
-- Drop any overly permissive location policies if they exist
DROP POLICY IF EXISTS "Public can view basic profiles" ON public.profiles;

-- Ensure location data is only shared with explicit consent and to friends
-- The existing policies seem mostly appropriate, but let's add an extra safety layer

-- Add a policy to prevent location data leakage in general searches
CREATE POLICY "Location data only for friends" ON public.profiles
FOR SELECT USING (
  -- If someone is requesting location data specifically
  CASE 
    WHEN location_lat IS NOT NULL AND location_lng IS NOT NULL THEN
      -- Only allow if users are friends AND both have location sharing enabled
      (auth.uid() = id) OR 
      (location_sharing = true AND EXISTS (
        SELECT 1 FROM public.friends f
        JOIN public.profiles requesting_user ON requesting_user.id = auth.uid()
        WHERE ((f.user1_id = auth.uid() AND f.user2_id = profiles.id) OR
               (f.user2_id = auth.uid() AND f.user1_id = profiles.id))
        AND requesting_user.location_sharing = true
      ))
    ELSE true  -- Non-location data can follow existing policies
  END
);