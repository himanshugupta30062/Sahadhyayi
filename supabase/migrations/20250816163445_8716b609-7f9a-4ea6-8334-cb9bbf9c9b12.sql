-- CRITICAL SECURITY FIX: Protect user location data from malicious tracking
-- Fix multiple location tables with public access vulnerabilities

-- 1. Fix user_books_location table (MAJOR SECURITY RISK - publicly readable)
-- Drop the dangerous public access policy
DROP POLICY IF EXISTS "Anyone can view location data for maps" ON public.user_books_location;

-- Create secure location access policies for user_books_location table
-- Only allow friends with mutual location sharing consent to see location data
CREATE POLICY "Friends can view book locations with consent" ON public.user_books_location
FOR SELECT USING (
  -- Allow user to see their own location data
  auth.uid() = user_id OR
  -- Allow friends to see location only if both users have location sharing enabled
  (EXISTS (
    SELECT 1 FROM public.friends f
    JOIN public.profiles p1 ON p1.id = auth.uid()
    JOIN public.profiles p2 ON p2.id = user_books_location.user_id
    WHERE ((f.user1_id = auth.uid() AND f.user2_id = user_books_location.user_id) OR
           (f.user2_id = auth.uid() AND f.user1_id = user_books_location.user_id))
    AND p1.location_sharing = true 
    AND p2.location_sharing = true
  ))
);

-- 2. Secure the user_locations table if it has any public policies
-- Check and fix user_locations policies to ensure they're secure
DROP POLICY IF EXISTS "Public can view locations" ON public.user_locations;

-- Ensure user_locations is properly secured (should already be from previous migration)
-- But let's make sure the friend policy requires location sharing consent
DROP POLICY IF EXISTS "Friends can view each other's locations" ON public.user_locations;

CREATE POLICY "Friends can view locations with mutual consent" ON public.user_locations
FOR SELECT USING (
  -- Allow user to see their own location
  auth.uid() = user_id OR
  -- Allow friends to see location only if both have location sharing enabled
  (EXISTS (
    SELECT 1 FROM public.friends f
    JOIN public.profiles p1 ON p1.id = auth.uid()
    JOIN public.profiles p2 ON p2.id = user_locations.user_id
    WHERE ((f.user1_id = auth.uid() AND f.user2_id = user_locations.user_id) OR
           (f.user2_id = auth.uid() AND f.user1_id = user_locations.user_id))
    AND p1.location_sharing = true 
    AND p2.location_sharing = true
  ))
);

-- 3. Create secure functions for location-based features
-- Function to get nearby book readers (secure version)
CREATE OR REPLACE FUNCTION public.get_nearby_book_readers(book_uuid uuid, radius_km numeric DEFAULT 5)
RETURNS TABLE(
  reader_id uuid,
  reader_name text,
  distance_km numeric,
  reading_since timestamp with time zone,
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
  -- Get current user's location from profiles
  SELECT location_lat, location_lng INTO user_lat, user_lng
  FROM public.profiles 
  WHERE id = auth.uid() AND location_sharing = true;
  
  -- If user doesn't have location or hasn't enabled sharing, return empty
  IF user_lat IS NULL OR user_lng IS NULL THEN
    RETURN;
  END IF;
  
  -- Return only friends who are reading the same book and have location sharing enabled
  RETURN QUERY
  SELECT 
    ubl.user_id as reader_id,
    p.full_name as reader_name,
    -- Calculate distance using Haversine formula
    (6371 * acos(cos(radians(user_lat)) * cos(radians(ubl.latitude)) * 
                cos(radians(ubl.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * sin(radians(ubl.latitude)))) as distance_km,
    ubl.created_at as reading_since,
    true as is_friend
  FROM public.user_books_location ubl
  JOIN public.friends f ON (
    (f.user1_id = auth.uid() AND f.user2_id = ubl.user_id) OR
    (f.user2_id = auth.uid() AND f.user1_id = ubl.user_id)
  )
  JOIN public.profiles p ON p.id = ubl.user_id
  WHERE ubl.book_id = book_uuid
  AND p.location_sharing = true
  AND ubl.user_id != auth.uid()
  AND (6371 * acos(cos(radians(user_lat)) * cos(radians(ubl.latitude)) * 
                  cos(radians(ubl.longitude) - radians(user_lng)) + 
                  sin(radians(user_lat)) * sin(radians(ubl.latitude)))) <= radius_km
  ORDER BY distance_km;
END;
$$;

-- 4. Create anonymized location analytics for admins
CREATE OR REPLACE FUNCTION public.get_location_usage_analytics()
RETURNS TABLE(
  total_book_locations BIGINT,
  active_location_sharers BIGINT,
  books_with_locations BIGINT,
  avg_locations_per_user NUMERIC
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
    COUNT(*) as total_book_locations,
    COUNT(DISTINCT ubl.user_id) as active_location_sharers,
    COUNT(DISTINCT ubl.book_id) as books_with_locations,
    ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT ubl.user_id), 0), 2) as avg_locations_per_user
  FROM public.user_books_location ubl
  JOIN public.profiles p ON p.id = ubl.user_id
  WHERE p.location_sharing = true;
END;
$$;

-- 5. Location privacy helper functions
-- Function to check if user has location sharing enabled
CREATE OR REPLACE FUNCTION public.user_has_location_sharing()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND location_sharing = true
    AND location_lat IS NOT NULL 
    AND location_lng IS NOT NULL
  );
END;
$$;

-- 6. Function to safely share book location (with consent validation)
CREATE OR REPLACE FUNCTION public.share_book_location(
  book_uuid uuid,
  lat double precision,
  lng double precision
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  location_id uuid;
  has_consent boolean;
BEGIN
  -- Check if user has given location sharing consent
  SELECT EXISTS (
    SELECT 1 FROM public.location_sharing_consent 
    WHERE user_id = auth.uid()
  ) INTO has_consent;
  
  IF NOT has_consent THEN
    RAISE EXCEPTION 'Location sharing consent required. Please enable location sharing in your settings.';
  END IF;
  
  -- Insert or update location
  INSERT INTO public.user_books_location (user_id, book_id, latitude, longitude)
  VALUES (auth.uid(), book_uuid, lat, lng)
  ON CONFLICT (user_id, book_id) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now()
  RETURNING id INTO location_id;
  
  RETURN location_id;
END;
$$;