
-- Create website_visits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.website_visits (
  id BIGSERIAL PRIMARY KEY,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  page_url TEXT
);

-- Enable row level security
ALTER TABLE public.website_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert visit records (for tracking purposes)
CREATE POLICY "Anyone can record visits" ON public.website_visits
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view visit counts
CREATE POLICY "Authenticated users can view visit counts" ON public.website_visits
  FOR SELECT USING (true);

-- Create a function to safely get visit count
CREATE OR REPLACE FUNCTION get_website_visit_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.website_visits);
END;
$$;

-- Create a function to record a visit
CREATE OR REPLACE FUNCTION record_website_visit(
  ip_addr TEXT DEFAULT NULL,
  user_agent_string TEXT DEFAULT NULL,
  page TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
  INSERT INTO public.website_visits (ip_address, user_agent, page_url)
  VALUES (ip_addr, user_agent_string, page);
END;
$$;
