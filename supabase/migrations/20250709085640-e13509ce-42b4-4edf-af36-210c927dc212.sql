
-- Create a function to get authors data
CREATE OR REPLACE FUNCTION get_authors_data()
RETURNS TABLE (
  id UUID,
  name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  location TEXT,
  website_url TEXT,
  social_links JSONB,
  genres TEXT[],
  books_count INTEGER,
  followers_count INTEGER,
  rating DECIMAL(2,1),
  upcoming_events INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.bio,
    a.profile_image_url,
    a.location,
    a.website_url,
    a.social_links,
    a.genres,
    a.books_count,
    a.followers_count,
    a.rating,
    a.upcoming_events,
    a.created_at,
    a.updated_at
  FROM public.authors a
  ORDER BY a.books_count DESC, a.followers_count DESC;
END;
$$;
