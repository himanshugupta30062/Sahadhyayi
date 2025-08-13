-- Step 1: Add author_id column to books_library table
ALTER TABLE public.books_library 
ADD COLUMN author_id UUID REFERENCES public.authors(id);

-- Step 2: Create a function to normalize author names for matching
CREATE OR REPLACE FUNCTION normalize_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(TRIM(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE
  SET search_path = 'public, pg_catalog';

-- Step 3: Create function to link existing books to authors
CREATE OR REPLACE FUNCTION link_books_to_authors()
RETURNS INTEGER AS $$
DECLARE
  book_record RECORD;
  author_record RECORD;
  linked_count INTEGER := 0;
BEGIN
  -- For each book without an author_id
  FOR book_record IN
    SELECT id, author, title
    FROM public.books_library
    WHERE author_id IS NULL AND author IS NOT NULL
  LOOP
    -- Try to find matching author
    SELECT id INTO author_record
    FROM public.authors
    WHERE normalize_name(name) = normalize_name(book_record.author)
    LIMIT 1;
    
    -- If author found, link the book
    IF FOUND THEN
      UPDATE public.books_library
      SET author_id = author_record.id
      WHERE id = book_record.id;
      linked_count := linked_count + 1;
    ELSE
      -- Create new author if not exists
      INSERT INTO public.authors (name, bio, location, genres, books_count)
      VALUES (
        book_record.author,
        'Bio will be updated by the author.',
        'Location to be updated',
        ARRAY['General'],
        0
      )
      RETURNING id INTO author_record.id;
      
      -- Link the book to new author
      UPDATE public.books_library
      SET author_id = author_record.id
      WHERE id = book_record.id;
      linked_count := linked_count + 1;
    END IF;
  END LOOP;
  
  RETURN linked_count;
END;
$$ LANGUAGE plpgsql
  SET search_path = 'public, pg_catalog';

-- Step 4: Execute the linking function
SELECT link_books_to_authors();

-- Step 5: Update the get_authors_data function to only show authors with books
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
  created_at timestamp with time zone, 
  updated_at timestamp with time zone,
  actual_books_count bigint
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
    a.updated_at,
    COUNT(bl.id) as actual_books_count
  FROM public.authors a
  INNER JOIN public.books_library bl ON a.id = bl.author_id
  GROUP BY a.id, a.name, a.bio, a.profile_image_url, a.location, a.website_url, 
           a.social_links, a.genres, a.books_count, a.followers_count, a.rating, 
           a.upcoming_events, a.created_at, a.updated_at
  HAVING COUNT(bl.id) > 0
  ORDER BY COUNT(bl.id) DESC, a.followers_count DESC, a.rating DESC;
END;
$$;

-- Step 6: Create trigger to auto-update book counts
CREATE OR REPLACE FUNCTION update_author_books_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update books_count for the affected author(s)
  IF TG_OP = 'DELETE' THEN
    UPDATE public.authors 
    SET books_count = (
      SELECT COUNT(*) 
      FROM public.books_library 
      WHERE author_id = OLD.author_id
    ),
    updated_at = NOW()
    WHERE id = OLD.author_id;
    RETURN OLD;
  ELSE
    UPDATE public.authors 
    SET books_count = (
      SELECT COUNT(*) 
      FROM public.books_library 
      WHERE author_id = NEW.author_id
    ),
    updated_at = NOW()
    WHERE id = NEW.author_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql
  SET search_path = 'public, pg_catalog';

-- Create trigger for automatic book count updates
DROP TRIGGER IF EXISTS trigger_update_author_books_count ON public.books_library;
CREATE TRIGGER trigger_update_author_books_count
  AFTER INSERT OR UPDATE OR DELETE ON public.books_library
  FOR EACH ROW
  EXECUTE FUNCTION update_author_books_count();