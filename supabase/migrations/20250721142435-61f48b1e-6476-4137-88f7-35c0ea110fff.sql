-- Add IP address and country code columns to website_visits table
ALTER TABLE public.website_visits 
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS country_code text;

-- Update the record_website_visit function to accept and store IP and country
CREATE OR REPLACE FUNCTION public.record_website_visit(
  ip_addr inet DEFAULT NULL,
  user_agent_string text DEFAULT NULL,
  page text DEFAULT NULL,
  country_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $function$
BEGIN
  INSERT INTO public.website_visits (ip_address, user_agent, page_url, country_code)
  VALUES (ip_addr, user_agent_string, page, country_code);
END;
$function$;