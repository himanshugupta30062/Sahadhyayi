-- Create rate_limits table for server-side rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(identifier, endpoint)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for system-level access only (edge functions use service role)
CREATE POLICY "System can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(identifier, endpoint, window_start);

-- Create function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer DEFAULT 10,
  p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_window_start timestamp with time zone;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Try to get existing record within window
  SELECT request_count INTO v_count
  FROM rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start > v_window_start;
  
  IF v_count IS NULL THEN
    -- No recent record, create new one
    INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, now())
    ON CONFLICT (identifier, endpoint) 
    DO UPDATE SET request_count = 1, window_start = now();
    RETURN true;
  ELSIF v_count >= p_max_requests THEN
    -- Rate limit exceeded
    RETURN false;
  ELSE
    -- Increment counter
    UPDATE rate_limits
    SET request_count = request_count + 1
    WHERE identifier = p_identifier
      AND endpoint = p_endpoint
      AND window_start > v_window_start;
    RETURN true;
  END IF;
END;
$$;

-- Create cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;