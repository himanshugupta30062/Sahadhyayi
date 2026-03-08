-- Step 1: Add is_authentic column
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS is_authentic boolean NOT NULL DEFAULT true;

-- Step 2: Mark non-authentic entries
UPDATE public.authors SET is_authentic = false
WHERE 
  (name = UPPER(name) AND length(name) <= 10)
  OR name ~* '(NCERT|CBSE|Editorial Board|Experts|Board|Ministry|Department|Committee|Institute|Council|Corporation|Authority|Foundation|Trust|Society|Academy|Bureau|Commission|Organization|Organisation|Publication|Publishers|Press|Prakashan|Sansthan|Compiled|Panel)'
  OR name ~ '^OL[0-9]'
  OR length(trim(name)) <= 1
  OR name ~ '^[0-9]';

-- Step 3: Drop old function and recreate
DROP FUNCTION IF EXISTS public.get_authors_with_books();

CREATE FUNCTION public.get_authors_with_books()
RETURNS TABLE (
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
SET search_path = public
AS $$
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
    COUNT(bl.id) as actual_books_count
  FROM authors a
  LEFT JOIN books_library bl ON bl.author_id = a.id
  WHERE a.is_authentic = true
  GROUP BY a.id
  HAVING COUNT(bl.id) > 0
  ORDER BY COUNT(bl.id) DESC, a.followers_count DESC;
$$;
