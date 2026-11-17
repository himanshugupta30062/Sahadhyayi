-- Harden the companion public author directory RPC.
-- Keep its authentic-author and books-only semantics while eliminating
-- search_path-dependent relation resolution in this SECURITY DEFINER function.
CREATE OR REPLACE FUNCTION public.get_authors_with_books()
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
  updated_at timestamptz,
  verified boolean,
  verification_type text,
  actual_books_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
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
    a.updated_at,
    a.verified,
    a.verification_type,
    COUNT(bl.id) AS actual_books_count
  FROM public.authors AS a
  LEFT JOIN public.books_library AS bl ON bl.author_id = a.id
  WHERE a.is_authentic IS TRUE
  GROUP BY a.id
  HAVING COUNT(bl.id) > 0
  ORDER BY COUNT(bl.id) DESC, a.followers_count DESC;
$function$;

REVOKE ALL ON FUNCTION public.get_authors_with_books() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_authors_with_books() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_authors_with_books() IS
  'Public authentic-author directory; includes only authentic authors linked to at least one library book.';
