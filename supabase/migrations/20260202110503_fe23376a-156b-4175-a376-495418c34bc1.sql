-- Fix cleanup_unused_books() to require admin privileges
CREATE OR REPLACE FUNCTION public.cleanup_unused_books()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    deleted_count integer := 0;
    book_record RECORD;
BEGIN
    -- SECURITY: Only admins can execute this function
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Find books that are not in any user's personal library
    -- and have newer versions available
    FOR book_record IN
        SELECT b.*
        FROM books_library b
        LEFT JOIN user_personal_library upl ON upl.book_id = b.id
        WHERE upl.book_id IS NULL -- Not in any user's library
        AND EXISTS (
            -- Check if a newer version exists
            SELECT 1 
            FROM books_library newer
            WHERE LOWER(TRIM(newer.title)) = LOWER(TRIM(b.title))
            AND LOWER(TRIM(COALESCE(newer.author, ''))) = LOWER(TRIM(COALESCE(b.author, '')))
            AND LOWER(TRIM(COALESCE(newer.language, 'english'))) = LOWER(TRIM(COALESCE(b.language, 'english')))
            AND COALESCE(newer.publication_year, 0) > COALESCE(b.publication_year, 0)
        )
    LOOP
        -- Log the deletion to audit log
        INSERT INTO public.security_audit_log (user_id, action, table_name, record_id)
        VALUES (auth.uid(), 'cleanup_book_delete', 'books_library', book_record.id);
        
        -- Delete the older unused version
        DELETE FROM books_library WHERE id = book_record.id;
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$;