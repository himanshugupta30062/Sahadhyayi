-- Keep unverified/non-authentic author records out of the public author directory.
-- The RPC is used by public author lookup; five legacy non-authentic rows exist
-- in production and must not be exposed as directory entries.
CREATE OR REPLACE FUNCTION public.get_authors_data()
RETURNS TABLE(
  id uuid,
  name text,
  bio text,
  profile_image_url text,
  location text,
  website_url text,
  social_links jsonb,
  genres text[],
  books_count integer,
  followers_count integer,
  rating numeric,
  upcoming_events integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
  FROM public.authors AS a
  WHERE a.is_authentic IS TRUE
  ORDER BY a.books_count DESC, a.followers_count DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_authors_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_authors_data() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_authors_data() IS
  'Public author directory; returns only authentic author records.';
