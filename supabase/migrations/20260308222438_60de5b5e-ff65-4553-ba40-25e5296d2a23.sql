
-- Efficient function to get top countries by visit count
CREATE OR REPLACE FUNCTION public.get_top_visitor_countries(limit_count integer DEFAULT 15)
RETURNS TABLE(country_code text, visit_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT 
    wv.country_code,
    COUNT(*) as visit_count
  FROM public.website_visits wv
  WHERE wv.country_code IS NOT NULL 
    AND wv.country_code != 'LOCAL'
    AND wv.country_code != ''
  GROUP BY wv.country_code
  ORDER BY visit_count DESC
  LIMIT limit_count;
$$;
