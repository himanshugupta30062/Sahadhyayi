-- Add country column to website_visits
ALTER TABLE public.website_visits
  ADD COLUMN IF NOT EXISTS country TEXT;

-- Update record_website_visit function to accept country
CREATE OR REPLACE FUNCTION record_website_visit(
  ip_addr TEXT DEFAULT NULL,
  user_agent_string TEXT DEFAULT NULL,
  page TEXT DEFAULT NULL,
  country_code TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.website_visits (ip_address, user_agent, page_url, country)
  VALUES (ip_addr, user_agent_string, page, country_code);
END;
$$;
