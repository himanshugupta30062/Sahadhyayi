
-- Create a junction table for user's personal book collection
-- This allows users to select which books from the global library they want in their personal collection
CREATE TABLE IF NOT EXISTS user_personal_library (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    book_id uuid NOT NULL REFERENCES books_library(id) ON DELETE CASCADE,
    added_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, book_id)
);

-- Enable RLS for user personal library
ALTER TABLE user_personal_library ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own personal library
CREATE POLICY "Users can manage their own personal library"
ON user_personal_library
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to cleanup unused books from global library
CREATE OR REPLACE FUNCTION cleanup_unused_books()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
DECLARE
    deleted_count integer := 0;
    book_record RECORD;
BEGIN
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
        -- Delete the older unused version
        DELETE FROM books_library WHERE id = book_record.id;
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_personal_library_user_id ON user_personal_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personal_library_book_id ON user_personal_library(book_id);
CREATE INDEX IF NOT EXISTS idx_books_library_title_author_lang ON books_library(LOWER(title), LOWER(author), LOWER(language));
