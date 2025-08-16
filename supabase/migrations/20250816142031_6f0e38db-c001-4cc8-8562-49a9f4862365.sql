-- CRITICAL SECURITY FIX: Protect user location data from stalkers and unauthorized access

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
  JOIN profiles current_profile ON current_profile.id = auth.uid()
  WHERE 
    p.location_sharing = true 
    AND current_profile.location_sharing = true
    AND p.location_lat IS NOT NULL 
    AND p.location_lng IS NOT NULL
    AND p.id != auth.uid();
END;
$$;