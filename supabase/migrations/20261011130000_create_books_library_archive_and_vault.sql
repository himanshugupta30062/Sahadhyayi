-- Migration: 20261011130000_create_books_library_archive_and_vault.sql
-- Description: Create books_library_archive table, refactor cleanup_unused_books to archive without deleting,
-- and provide admin RPCs to archive unwanted books and restore them in the future.

-- 1. Create dedicated archive table (invisible to regular users)
CREATE TABLE IF NOT EXISTS public.books_library_archive (
    id uuid PRIMARY KEY,
    title text NOT NULL,
    author text,
    genre text,
    cover_image_url text,
    description text,
    author_bio text,
    isbn text,
    publication_year integer,
    pages integer,
    language text,
    pdf_url text,
    created_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now(),
    archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    archive_reason text,
    original_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_books_archive_title ON public.books_library_archive(title);
CREATE INDEX IF NOT EXISTS idx_books_archive_author ON public.books_library_archive(author);
CREATE INDEX IF NOT EXISTS idx_books_archive_archived_at ON public.books_library_archive(archived_at);

-- 2. Restrict access: Only admins can view or modify the archive vault
ALTER TABLE public.books_library_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only can view archived books" ON public.books_library_archive;
CREATE POLICY "Admins only can view archived books"
    ON public.books_library_archive
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins only can insert archived books" ON public.books_library_archive;
CREATE POLICY "Admins only can insert archived books"
    ON public.books_library_archive
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins only can update archived books" ON public.books_library_archive;
CREATE POLICY "Admins only can update archived books"
    ON public.books_library_archive
    FOR UPDATE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins only can delete archived books" ON public.books_library_archive;
CREATE POLICY "Admins only can delete archived books"
    ON public.books_library_archive
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 3. Refactor cleanup_unused_books(): NEVER delete books; move them to books_library_archive
CREATE OR REPLACE FUNCTION public.cleanup_unused_books()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    archived_count integer := 0;
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
        AND COALESCE(b.status, 'active') = 'active'
        AND EXISTS (
            -- Check if a newer version exists
            SELECT 1 
            FROM books_library newer
            WHERE LOWER(TRIM(newer.title)) = LOWER(TRIM(b.title))
            AND LOWER(TRIM(COALESCE(newer.author, ''))) = LOWER(TRIM(COALESCE(b.author, '')))
            AND LOWER(TRIM(COALESCE(newer.language, 'english'))) = LOWER(TRIM(COALESCE(b.language, 'english')))
            AND COALESCE(newer.publication_year, 0) > COALESCE(b.publication_year, 0)
            AND newer.id != b.id
        )
    LOOP
        -- 1. Copy into archive table
        INSERT INTO public.books_library_archive (
            id, title, author, genre, cover_image_url, description,
            author_bio, isbn, publication_year, pages, language, pdf_url,
            created_at, archived_at, archived_by, archive_reason, original_data
        ) VALUES (
            book_record.id, book_record.title, book_record.author, book_record.genre,
            book_record.cover_image_url, book_record.description, book_record.author_bio,
            book_record.isbn, book_record.publication_year, book_record.pages,
            book_record.language, book_record.pdf_url, book_record.created_at,
            now(), auth.uid(), 'Automated cleanup of unused older version', to_jsonb(book_record)
        )
        ON CONFLICT (id) DO UPDATE SET
            archived_at = now(),
            archive_reason = EXCLUDED.archive_reason;

        -- 2. Mark as archived in books_library so it is hidden from regular users without deleting
        UPDATE public.books_library
        SET
            status = 'archived',
            archive_reason = 'Automated cleanup of unused older version (saved in archive vault)',
            last_audited_at = now()
        WHERE id = book_record.id;

        -- 3. Log to audit log
        INSERT INTO public.security_audit_log (user_id, action, table_name, record_id)
        VALUES (auth.uid(), 'cleanup_book_archived', 'books_library', book_record.id);

        archived_count := archived_count + 1;
    END LOOP;
    
    RETURN archived_count;
END;
$$;

-- 4. Admin RPC to Archive Unwanted Book (Places into archive vault, hides from users)
CREATE OR REPLACE FUNCTION public.archive_unwanted_book(
    p_book_id uuid,
    p_reason text DEFAULT 'Archived by administrator'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_book RECORD;
BEGIN
    -- SECURITY: Only admins can archive books
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    SELECT * INTO v_book FROM public.books_library WHERE id = p_book_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Book with ID % not found in library', p_book_id;
    END IF;

    -- Copy to archive vault table
    INSERT INTO public.books_library_archive (
        id, title, author, genre, cover_image_url, description,
        author_bio, isbn, publication_year, pages, language, pdf_url,
        created_at, archived_at, archived_by, archive_reason, original_data
    ) VALUES (
        v_book.id, v_book.title, v_book.author, v_book.genre,
        v_book.cover_image_url, v_book.description, v_book.author_bio,
        v_book.isbn, v_book.publication_year, v_book.pages,
        v_book.language, v_book.pdf_url, v_book.created_at,
        now(), auth.uid(), COALESCE(p_reason, 'Archived by administrator'), to_jsonb(v_book)
    )
    ON CONFLICT (id) DO UPDATE SET
        archived_at = now(),
        archived_by = auth.uid(),
        archive_reason = EXCLUDED.archive_reason;

    -- Update books_library to hide from regular users
    UPDATE public.books_library
    SET
        status = 'archived',
        archive_reason = COALESCE(p_reason, 'Archived by administrator'),
        last_audited_at = now()
    WHERE id = p_book_id;

    -- Audit trail
    INSERT INTO public.security_audit_log (user_id, action, table_name, record_id)
    VALUES (auth.uid(), 'admin_archive_unwanted_book', 'books_library', p_book_id);

    RETURN jsonb_build_object(
        'success', true,
        'book_id', p_book_id,
        'title', v_book.title,
        'status', 'archived',
        'message', 'Book safely moved to archive vault and hidden from users'
    );
END;
$$;

-- 5. Admin RPC to Restore Book from Archive Vault (Brings back into active catalog)
CREATE OR REPLACE FUNCTION public.restore_book_from_archive(
    p_book_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_archived RECORD;
BEGIN
    -- SECURITY: Only admins can restore books
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    SELECT * INTO v_archived FROM public.books_library_archive WHERE id = p_book_id;

    -- If present in archive table
    IF FOUND THEN
        -- Check if row still exists in books_library
        IF EXISTS (SELECT 1 FROM public.books_library WHERE id = p_book_id) THEN
            UPDATE public.books_library
            SET
                status = 'active',
                superseded_by_id = NULL,
                archive_reason = NULL,
                last_audited_at = now()
            WHERE id = p_book_id;
        ELSE
            -- Re-insert from archive data
            INSERT INTO public.books_library (
                id, title, author, genre, cover_image_url, description,
                author_bio, isbn, publication_year, pages, language, pdf_url,
                created_at, status
            ) VALUES (
                v_archived.id, v_archived.title, v_archived.author, v_archived.genre,
                v_archived.cover_image_url, v_archived.description, v_archived.author_bio,
                v_archived.isbn, v_archived.publication_year, v_archived.pages,
                v_archived.language, v_archived.pdf_url, v_archived.created_at, 'active'
            );
        END IF;

        -- Remove from archive vault
        DELETE FROM public.books_library_archive WHERE id = p_book_id;
    ELSE
        -- Fallback: If not in archive table, check if simply marked archived in books_library
        IF EXISTS (SELECT 1 FROM public.books_library WHERE id = p_book_id) THEN
            UPDATE public.books_library
            SET
                status = 'active',
                superseded_by_id = NULL,
                archive_reason = NULL,
                last_audited_at = now()
            WHERE id = p_book_id;
        ELSE
            RAISE EXCEPTION 'Book with ID % not found in archive vault or library', p_book_id;
        END IF;
    END IF;

    -- Audit trail
    INSERT INTO public.security_audit_log (user_id, action, table_name, record_id)
    VALUES (auth.uid(), 'admin_restore_book', 'books_library', p_book_id);

    RETURN jsonb_build_object(
        'success', true,
        'book_id', p_book_id,
        'status', 'active',
        'message', 'Book restored to active library and visible to users'
    );
END;
$$;

-- 6. Admin RPC to List All Archived Books in Vault
CREATE OR REPLACE FUNCTION public.get_archived_books()
RETURNS TABLE (
    id uuid,
    title text,
    author text,
    genre text,
    cover_image_url text,
    description text,
    isbn text,
    publication_year integer,
    pages integer,
    language text,
    pdf_url text,
    created_at timestamp with time zone,
    archived_at timestamp with time zone,
    archive_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    RETURN QUERY
    SELECT
        a.id,
        a.title,
        a.author,
        a.genre,
        a.cover_image_url,
        a.description,
        a.isbn,
        a.publication_year,
        a.pages,
        a.language,
        a.pdf_url,
        a.created_at,
        a.archived_at,
        a.archive_reason
    FROM public.books_library_archive a
    ORDER BY a.archived_at DESC;
END;
$$;
