-- Create secure functions for community stats that bypass RLS for counting
-- This allows us to get community statistics without exposing individual user data

-- Function to get total registered users count
CREATE OR REPLACE FUNCTION public.get_total_users_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.profiles);
END;
$$;

-- Function to get total website visits count  
CREATE OR REPLACE FUNCTION public.get_website_visit_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.website_visits);
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_total_users_count() IS 
'Security function to get total registered users count for community stats without exposing individual profiles';

COMMENT ON FUNCTION public.get_website_visit_count() IS 
'Security function to get total website visits count for community stats without exposing individual visit data';