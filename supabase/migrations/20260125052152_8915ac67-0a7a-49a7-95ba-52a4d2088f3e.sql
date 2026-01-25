-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits;

-- Create restrictive policies that deny all user access
-- Rate limits should only be managed by the service role (backend/edge functions)

-- Deny SELECT for all users (service role bypasses RLS)
CREATE POLICY "No user access to rate_limits"
ON public.rate_limits
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);