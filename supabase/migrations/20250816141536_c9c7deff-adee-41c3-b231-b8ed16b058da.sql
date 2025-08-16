-- Fix website_visits table security - restrict access to administrators only

-- First, create a user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Create RLS policies for user_roles table
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (public.is_admin());

-- Drop existing problematic policies on website_visits
DROP POLICY IF EXISTS "Public can record visits" ON public.website_visits;
DROP POLICY IF EXISTS "Anyone can record visits" ON public.website_visits;
DROP POLICY IF EXISTS "Authenticated users can view visit counts" ON public.website_visits;
DROP POLICY IF EXISTS "Admins can view visits" ON public.website_visits;

-- Create secure policies for website_visits table
-- Allow edge functions and system to record visits (using service role key)
CREATE POLICY "System can record visits" ON public.website_visits
FOR INSERT WITH CHECK (true);

-- Only admins can view visit data (protecting user privacy)
CREATE POLICY "Only admins can view visit data" ON public.website_visits
FOR SELECT USING (public.is_admin());

-- Admins can delete old visit data for maintenance
CREATE POLICY "Admins can delete visit data" ON public.website_visits
FOR DELETE USING (public.is_admin());

-- Update the record_website_visit function to use proper security
CREATE OR REPLACE FUNCTION public.record_website_visit(
  ip_addr inet DEFAULT NULL,
  user_agent_string text DEFAULT NULL,
  page text DEFAULT NULL,
  country_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.website_visits (ip_address, user_agent, page_url, country_code)
  VALUES (ip_addr, user_agent_string, page, country_code);
END;
$$;

-- Create a secure function for getting visit counts (without exposing sensitive data)
CREATE OR REPLACE FUNCTION public.get_website_visit_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.website_visits);
END;
$$;

-- Create a function for admins to view anonymized visit statistics
CREATE OR REPLACE FUNCTION public.get_visit_statistics()
RETURNS TABLE(
  total_visits BIGINT,
  unique_countries BIGINT,
  visits_today BIGINT,
  visits_this_week BIGINT
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
    COUNT(*) as total_visits,
    COUNT(DISTINCT country_code) as unique_countries,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as visits_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as visits_this_week
  FROM public.website_visits;
END;
$$;