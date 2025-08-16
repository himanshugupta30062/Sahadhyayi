-- CRITICAL SECURITY FIX: Continue location privacy protection

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