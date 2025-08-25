-- Enable required extensions for full-text search and fuzzy matching
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create search vector column and update trigger if not exists
DO $$
BEGIN
    -- Add search_vec column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books_library' 
        AND column_name = 'search_vec'
    ) THEN
        ALTER TABLE public.books_library 
        ADD COLUMN search_vec tsvector;
    END IF;
    
    -- Add popularity column if it doesn't exist (assuming it might be missing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books_library' 
        AND column_name = 'popularity'
    ) THEN
        ALTER TABLE public.books_library 
        ADD COLUMN popularity numeric DEFAULT 0;
    END IF;
END $$;

-- Create search vector update function
CREATE OR REPLACE FUNCTION public.update_search_vec()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.search_vec := to_tsvector('simple', 
        unaccent(coalesce(NEW.title, '')) || ' ' || 
        unaccent(coalesce(NEW.author, '')) || ' ' || 
        unaccent(coalesce(NEW.description, '')) || ' ' ||
        array_to_string(coalesce(NEW.genres, ARRAY[]::text[]), ' ')
    );
    RETURN NEW;
END;
$$;

-- Create trigger for automatic search vector updates
DROP TRIGGER IF EXISTS books_library_search_vec_trigger ON public.books_library;
CREATE TRIGGER books_library_search_vec_trigger
    BEFORE INSERT OR UPDATE ON public.books_library
    FOR EACH ROW
    EXECUTE FUNCTION public.update_search_vec();

-- Update existing records with search vectors
UPDATE public.books_library 
SET search_vec = to_tsvector('simple', 
    unaccent(coalesce(title, '')) || ' ' || 
    unaccent(coalesce(author, '')) || ' ' || 
    unaccent(coalesce(description, '')) || ' ' ||
    array_to_string(coalesce(genres, ARRAY[]::text[]), ' ')
)
WHERE search_vec IS NULL;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS books_library_search_gin 
ON public.books_library USING gin(search_vec);

CREATE INDEX IF NOT EXISTS books_library_title_trgm 
ON public.books_library USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS books_library_author_trgm 
ON public.books_library USING gin(author gin_trgm_ops);

CREATE INDEX IF NOT EXISTS books_library_genres_gin 
ON public.books_library USING gin(genres);

CREATE INDEX IF NOT EXISTS books_library_language_idx 
ON public.books_library(language);

CREATE INDEX IF NOT EXISTS books_library_popularity_idx 
ON public.books_library(popularity DESC);

-- Main search function with advanced ranking and filtering
CREATE OR REPLACE FUNCTION public.search_books(
    q text,
    max_results int DEFAULT 50,
    lang text DEFAULT NULL,
    min_popularity numeric DEFAULT NULL,
    genres_filter text[] DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    title text,
    author text,
    genres text[],
    language text,
    cover_url text,
    popularity numeric,
    snippet text,
    rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    query tsquery;
    clean_q text;
BEGIN
    -- Clean and prepare search query
    clean_q := trim(coalesce(q, ''));
    
    -- Return empty if query is too short
    IF length(clean_q) < 2 THEN
        RETURN;
    END IF;
    
    -- Build tsquery with phrase and negation support
    BEGIN
        query := websearch_to_tsquery('simple', unaccent(clean_q));
    EXCEPTION WHEN OTHERS THEN
        -- Fallback to plainto_tsquery if websearch fails
        query := plainto_tsquery('simple', unaccent(clean_q));
    END;
    
    RETURN QUERY
    WITH search_results AS (
        SELECT 
            bl.id,
            bl.title,
            bl.author,
            bl.genres,
            bl.language,
            bl.cover_image_url as cover_url,
            coalesce(bl.popularity, 0) as popularity,
            -- Generate highlighted snippet
            ts_headline(
                'simple',
                coalesce(bl.description, bl.title || ' by ' || coalesce(bl.author, 'Unknown')),
                query,
                'MaxFragments=2, MinWords=5, MaxWords=12, StartSel=<mark>, StopSel=</mark>, HighlightAll=false'
            ) as snippet,
            -- Advanced ranking formula
            (
                ts_rank_cd(bl.search_vec, query) * 2.0 +
                similarity(unaccent(bl.title), unaccent(clean_q)) * 0.5 +
                similarity(unaccent(coalesce(bl.author, '')), unaccent(clean_q)) * 0.3 +
                CASE WHEN bl.popularity > 0 THEN ln(bl.popularity + 1) * 0.1 ELSE 0 END
            ) as rank
        FROM public.books_library bl
        WHERE 
            -- Full-text search OR trigram similarity
            (
                bl.search_vec @@ query OR
                similarity(unaccent(bl.title), unaccent(clean_q)) > 0.25 OR
                similarity(unaccent(coalesce(bl.author, '')), unaccent(clean_q)) > 0.25
            )
            -- Language filter
            AND (lang IS NULL OR bl.language = lang)
            -- Popularity filter  
            AND (min_popularity IS NULL OR coalesce(bl.popularity, 0) >= min_popularity)
            -- Genres filter (array overlap)
            AND (genres_filter IS NULL OR bl.genres && genres_filter)
    )
    SELECT 
        sr.id,
        sr.title,
        sr.author,
        sr.genres,
        sr.language,
        sr.cover_url,
        sr.popularity,
        sr.snippet,
        sr.rank
    FROM search_results sr
    WHERE sr.rank > 0.01  -- Filter out very low relevance results
    ORDER BY sr.rank DESC, sr.popularity DESC NULLS LAST, sr.title
    LIMIT greatest(10, max_results);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_books(text, int, text, numeric, text[]) TO anon, authenticated;

-- Create function to get search facets (language and genre counts)
CREATE OR REPLACE FUNCTION public.get_search_facets(
    q text DEFAULT '',
    lang text DEFAULT NULL,
    min_popularity numeric DEFAULT NULL,
    genres_filter text[] DEFAULT NULL
)
RETURNS TABLE(
    languages jsonb,
    genres jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    query tsquery;
    clean_q text;
BEGIN
    clean_q := trim(coalesce(q, ''));
    
    -- Build query if search term provided
    IF length(clean_q) >= 2 THEN
        BEGIN
            query := websearch_to_tsquery('simple', unaccent(clean_q));
        EXCEPTION WHEN OTHERS THEN
            query := plainto_tsquery('simple', unaccent(clean_q));
        END;
    END IF;
    
    RETURN QUERY
    WITH filtered_books AS (
        SELECT bl.language, bl.genres
        FROM public.books_library bl
        WHERE 
            (clean_q = '' OR length(clean_q) < 2 OR 
             bl.search_vec @@ query OR
             similarity(unaccent(bl.title), unaccent(clean_q)) > 0.25 OR
             similarity(unaccent(coalesce(bl.author, '')), unaccent(clean_q)) > 0.25)
            AND (lang IS NULL OR bl.language = lang)
            AND (min_popularity IS NULL OR coalesce(bl.popularity, 0) >= min_popularity)
            AND (genres_filter IS NULL OR bl.genres && genres_filter)
    ),
    language_counts AS (
        SELECT jsonb_object_agg(language, count) as languages
        FROM (
            SELECT language, count(*) as count
            FROM filtered_books
            WHERE language IS NOT NULL
            GROUP BY language
            ORDER BY count DESC, language
        ) lc
    ),
    genre_counts AS (
        SELECT jsonb_object_agg(genre, count) as genres  
        FROM (
            SELECT unnest(genres) as genre, count(*) as count
            FROM filtered_books
            WHERE genres IS NOT NULL AND array_length(genres, 1) > 0
            GROUP BY genre
            ORDER BY count DESC, genre
        ) gc
    )
    SELECT 
        coalesce(lc.languages, '{}'::jsonb) as languages,
        coalesce(gc.genres, '{}'::jsonb) as genres
    FROM language_counts lc
    CROSS JOIN genre_counts gc;
END;
$$;

-- Grant permissions for facets function
GRANT EXECUTE ON FUNCTION public.get_search_facets(text, text, numeric, text[]) TO anon, authenticated;