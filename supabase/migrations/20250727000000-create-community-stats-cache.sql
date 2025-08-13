-- Create table to cache aggregated community statistics
CREATE TABLE IF NOT EXISTS public.community_stats_cache (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_signups BIGINT NOT NULL DEFAULT 0,
  total_visits BIGINT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ensure a single row exists
INSERT INTO public.community_stats_cache (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Function to refresh the cached counts
CREATE OR REPLACE FUNCTION public.refresh_community_stats_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.community_stats_cache
  SET total_signups = (SELECT COUNT(*) FROM public.profiles),
      total_visits = (SELECT COUNT(*) FROM public.website_visits),
      last_updated = now()
  WHERE id = 1;
END;
$$;
