-- Migration: 20261011140000_admin_book_archive_and_hide_system.sql
-- Description: Complete admin-controlled book archive, hide and restore system.
-- Enforces catalog_status ('active', 'needs_review', 'archived', 'superseded'),
-- updates books_library_archive with recovery snapshots, strictly restricts RLS SELECT
-- on books_library so only active books are visible publicly while admins can see everything,
-- and provides transaction-safe RPCs for archiving and restoring without deleting records.

-- ============================================================================
-- 1. EXTEND books_library WITH catalog_status AND ARCHIVE METADATA
-- ============================================================================

ALTER TABLE public.books_library
  ADD COLUMN IF NOT EXISTS catalog_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason text,
  ADD COLUMN IF NOT EXISTS archive_classification text DEFAULT 'unwanted',
  ADD COLUMN IF NOT EXISTS canonical_book_id uuid REFERENCES public.books_library(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_batch_id text;

-- Add check constraint for catalog_status if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'books_library_catalog_status_check'
  ) THEN
    ALTER TABLE public.books_library
      ADD CONSTRAINT books_library_catalog_status_check
      CHECK (catalog_status IN ('active', 'needs_review', 'archived', 'superseded'));
  END IF;
END $$;

-- Synchronize existing rows
UPDATE public.books_library
SET catalog_status = CASE
  WHEN status IN ('archived', 'superseded', 'junk') THEN 'archived'
  ELSE 'active'
END
WHERE catalog_status IS NULL;

-- Trigger to keep status and catalog_status aligned
CREATE OR REPLACE FUNCTION public.sync_books_library_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.catalog_status IS NOT NULL THEN
    NEW.status := NEW.catalog_status;
  ELSIF NEW.status IS NOT NULL THEN
    NEW.catalog_status := NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_books_library_status ON public.books_library;
CREATE TRIGGER trigger_sync_books_library_status
  BEFORE INSERT OR UPDATE ON public.books_library
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_books_library_status();

CREATE INDEX IF NOT EXISTS idx_books_library_catalog_status ON public.books_library(catalog_status);
CREATE INDEX IF NOT EXISTS idx_books_library_canonical_book ON public.books_library(canonical_book_id);
CREATE INDEX IF NOT EXISTS idx_books_library_archived_at ON public.books_library(archived_at);

-- ============================================================================
-- 2. EXTEND books_library_archive AS RECOVERY SNAPSHOT VAULT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.books_library_archive (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id uuid,
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
    archive_classification text DEFAULT 'unwanted',
    canonical_book_id uuid REFERENCES public.books_library(id) ON DELETE SET NULL,
    catalog_status text NOT NULL DEFAULT 'archived',
    previous_catalog_status text DEFAULT 'active',
    book_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    original_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    review_evidence jsonb DEFAULT '{}'::jsonb,
    archive_batch_id text
);

ALTER TABLE public.books_library_archive
  ADD COLUMN IF NOT EXISTS book_id uuid,
  ADD COLUMN IF NOT EXISTS book_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS catalog_status text DEFAULT 'archived',
  ADD COLUMN IF NOT EXISTS previous_catalog_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS archive_classification text DEFAULT 'unwanted',
  ADD COLUMN IF NOT EXISTS canonical_book_id uuid REFERENCES public.books_library(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_evidence jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS archive_batch_id text;

CREATE INDEX IF NOT EXISTS idx_books_archive_book_id ON public.books_library_archive(book_id);
CREATE INDEX IF NOT EXISTS idx_books_archive_archived_at ON public.books_library_archive(archived_at);
CREATE INDEX IF NOT EXISTS idx_books_archive_classification ON public.books_library_archive(archive_classification);

-- ============================================================================
-- 3. CRITICAL RLS RECONCILIATION ON books_library AND books_library_archive
-- ============================================================================

ALTER TABLE public.books_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books_library_archive ENABLE ROW LEVEL SECURITY;

-- Drop all overly permissive SELECT policies on books_library
DROP POLICY IF EXISTS "Anyone can view books library" ON public.books_library;
DROP POLICY IF EXISTS "Anyone can read library books" ON public.books_library;
DROP POLICY IF EXISTS "Anyone can view books" ON public.books_library;
DROP POLICY IF EXISTS "Public can view active books library" ON public.books_library;
DROP POLICY IF EXISTS "Admins can view all books library" ON public.books_library;

-- Strict SELECT policy:
-- 1. Public / ordinary users can see ONLY active catalog books.
-- 2. Administrators can inspect all records including archived/superseded ones.
CREATE POLICY "Public can view active books library"
ON public.books_library
FOR SELECT
TO public
USING (
  (COALESCE(catalog_status, status, 'active') = 'active')
  OR
  (auth.uid() IS NOT NULL AND public.is_admin() IS TRUE)
);

-- Delete policy: restrict DELETE exclusively to admins. Routine cleanup NEVER deletes.
DROP POLICY IF EXISTS "Only admins can delete library books" ON public.books_library;
CREATE POLICY "Only admins can delete library books"
ON public.books_library
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Secure policies on books_library_archive: Admin-only
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

-- ============================================================================
-- 4. TRANSACTION-SAFE RPC: archive_library_book
-- ============================================================================

CREATE OR REPLACE FUNCTION public.archive_library_book(
    p_book_id uuid,
    p_reason text,
    p_classification text DEFAULT 'unwanted',
    p_canonical_book_id uuid DEFAULT NULL,
    p_batch_id text DEFAULT NULL,
    p_evidence jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_id uuid;
    v_book record;
    v_archive_id uuid := gen_random_uuid();
    v_prev_status text;
    v_shelves_count int := 0;
    v_progress_count int := 0;
    v_notes_count int := 0;
BEGIN
    -- 1. Check admin authorization
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can archive books from the library.';
    END IF;
    v_admin_id := auth.uid();

    -- 2. Fetch the target book
    SELECT * INTO v_book FROM public.books_library WHERE id = p_book_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Book with ID % not found in books_library.', p_book_id;
    END IF;

    -- 3. Idempotent guard
    IF v_book.catalog_status = 'archived' THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_archived', true,
            'message', 'Book is already archived in the library.',
            'book_id', p_book_id,
            'catalog_status', 'archived'
        );
    END IF;

    v_prev_status := COALESCE(v_book.catalog_status, v_book.status, 'active');

    -- Count existing user references for audit protection
    SELECT COUNT(*) INTO v_shelves_count FROM public.user_bookshelf WHERE book_id = p_book_id;
    SELECT COUNT(*) INTO v_progress_count FROM public.reading_progress WHERE book_id = p_book_id;
    SELECT COUNT(*) INTO v_notes_count FROM public.margin_notes WHERE book_id = p_book_id;

    -- 4. Insert recovery snapshot into books_library_archive
    INSERT INTO public.books_library_archive (
        id,
        book_id,
        title,
        author,
        genre,
        cover_image_url,
        description,
        author_bio,
        isbn,
        publication_year,
        pages,
        language,
        pdf_url,
        created_at,
        archived_at,
        archived_by,
        archive_reason,
        archive_classification,
        canonical_book_id,
        catalog_status,
        previous_catalog_status,
        book_snapshot,
        original_data,
        review_evidence,
        archive_batch_id
    ) VALUES (
        v_archive_id,
        p_book_id,
        v_book.title,
        v_book.author,
        v_book.genre,
        v_book.cover_image_url,
        v_book.description,
        v_book.author_bio,
        v_book.isbn,
        v_book.publication_year,
        v_book.pages,
        v_book.language,
        v_book.pdf_url,
        v_book.created_at,
        now(),
        v_admin_id,
        p_reason,
        p_classification,
        p_canonical_book_id,
        'archived',
        v_prev_status,
        to_jsonb(v_book),
        to_jsonb(v_book),
        p_evidence,
        p_batch_id
    );

    -- 5. Update books_library row to hidden/archived without deleting
    UPDATE public.books_library
    SET catalog_status = 'archived',
        status = 'archived',
        archived_at = now(),
        archived_by = v_admin_id,
        archive_reason = p_reason,
        archive_classification = p_classification,
        canonical_book_id = p_canonical_book_id,
        superseded_by_id = COALESCE(p_canonical_book_id, superseded_by_id),
        archive_batch_id = p_batch_id,
        last_audited_at = now()
    WHERE id = p_book_id;

    -- 6. Insert audit log event
    INSERT INTO public.book_duplicate_audit_logs (
        action,
        group_id,
        primary_book_id,
        affected_book_ids,
        performed_by,
        reason,
        snapshot
    ) VALUES (
        'archive_library_book',
        COALESCE(p_batch_id, 'manual_archive'),
        p_canonical_book_id,
        ARRAY[p_book_id],
        v_admin_id,
        p_reason,
        jsonb_build_object(
            'archive_id', v_archive_id,
            'book_id', p_book_id,
            'previous_status', v_prev_status,
            'classification', p_classification,
            'user_references', jsonb_build_object(
                'shelves', v_shelves_count,
                'progress', v_progress_count,
                'notes', v_notes_count
            )
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Book successfully archived from public Library and safely preserved in vault.',
        'book_id', p_book_id,
        'archive_id', v_archive_id,
        'catalog_status', 'archived',
        'previous_status', v_prev_status,
        'user_references', jsonb_build_object(
            'shelves', v_shelves_count,
            'progress', v_progress_count,
            'notes', v_notes_count
        )
    );
END;
$$;

-- ============================================================================
-- 5. TRANSACTION-SAFE RPC: restore_library_book
-- ============================================================================

CREATE OR REPLACE FUNCTION public.restore_library_book(
    p_book_id uuid,
    p_restore_reason text DEFAULT 'Restored by administrator',
    p_target_status text DEFAULT 'active'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_id uuid;
    v_book record;
    v_snapshot record;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can restore archived books.';
    END IF;
    v_admin_id := auth.uid();

    SELECT * INTO v_book FROM public.books_library WHERE id = p_book_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Book with ID % not found in books_library.', p_book_id;
    END IF;

    -- Check latest archive snapshot for audit tracking
    SELECT * INTO v_snapshot 
    FROM public.books_library_archive 
    WHERE book_id = p_book_id OR id = p_book_id 
    ORDER BY archived_at DESC 
    LIMIT 1;

    -- Update row back to target status without deleting or changing UUID
    UPDATE public.books_library
    SET catalog_status = p_target_status,
        status = p_target_status,
        archived_at = NULL,
        archived_by = NULL,
        archive_reason = NULL,
        archive_classification = NULL,
        canonical_book_id = NULL,
        superseded_by_id = NULL,
        archive_batch_id = NULL,
        last_audited_at = now()
    WHERE id = p_book_id;

    -- Log recovery action
    INSERT INTO public.book_duplicate_audit_logs (
        action,
        group_id,
        primary_book_id,
        affected_book_ids,
        performed_by,
        reason,
        snapshot
    ) VALUES (
        'restore_library_book',
        'manual_restore',
        p_book_id,
        ARRAY[p_book_id],
        v_admin_id,
        p_restore_reason,
        jsonb_build_object(
            'restored_book_id', p_book_id,
            'new_status', p_target_status,
            'archive_snapshot_id', v_snapshot.id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Book successfully restored to public Library.',
        'book_id', p_book_id,
        'catalog_status', p_target_status
    );
END;
$$;

-- ============================================================================
-- 6. RPC: get_admin_archived_books WITH USER REFERENCE METRICS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_archived_books(
    p_search text DEFAULT NULL,
    p_classification text DEFAULT NULL,
    p_limit int DEFAULT 50,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    archive_id uuid,
    book_id uuid,
    title text,
    author text,
    genre text,
    cover_image_url text,
    isbn text,
    publication_year integer,
    language text,
    catalog_status text,
    previous_catalog_status text,
    archive_reason text,
    archive_classification text,
    archived_at timestamp with time zone,
    archived_by uuid,
    archived_by_email text,
    canonical_book_id uuid,
    canonical_title text,
    user_shelves_count bigint,
    reading_progress_count bigint,
    margin_notes_count bigint,
    reviews_count bigint,
    reading_rooms_count bigint,
    book_snapshot jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can view archived books.';
    END IF;

    RETURN QUERY
    SELECT 
        a.id AS archive_id,
        b.id AS book_id,
        b.title AS title,
        b.author AS author,
        b.genre AS genre,
        b.cover_image_url AS cover_image_url,
        b.isbn AS isbn,
        b.publication_year AS publication_year,
        b.language AS language,
        COALESCE(b.catalog_status, b.status, 'archived') AS catalog_status,
        COALESCE(a.previous_catalog_status, 'active') AS previous_catalog_status,
        COALESCE(b.archive_reason, a.archive_reason) AS archive_reason,
        COALESCE(b.archive_classification, a.archive_classification, 'unwanted') AS archive_classification,
        COALESCE(b.archived_at, a.archived_at) AS archived_at,
        COALESCE(b.archived_by, a.archived_by) AS archived_by,
        u.email::text AS archived_by_email,
        b.canonical_book_id AS canonical_book_id,
        cb.title AS canonical_title,
        (SELECT COUNT(*) FROM public.user_bookshelf s WHERE s.book_id = b.id) AS user_shelves_count,
        (SELECT COUNT(*) FROM public.reading_progress p WHERE p.book_id = b.id) AS reading_progress_count,
        (SELECT COUNT(*) FROM public.margin_notes mn WHERE mn.book_id = b.id) AS margin_notes_count,
        (SELECT COUNT(*) FROM public.book_reviews br WHERE br.book_id = b.id) AS reviews_count,
        (SELECT COUNT(*) FROM public.reading_rooms rr WHERE rr.book_id = b.id) AS reading_rooms_count,
        COALESCE(a.book_snapshot, a.original_data, to_jsonb(b)) AS book_snapshot
    FROM public.books_library b
    LEFT JOIN (
        SELECT DISTINCT ON (COALESCE(book_id, id)) *
        FROM public.books_library_archive
        ORDER BY COALESCE(book_id, id), archived_at DESC
    ) a ON a.book_id = b.id OR a.id = b.id
    LEFT JOIN auth.users u ON u.id = COALESCE(b.archived_by, a.archived_by)
    LEFT JOIN public.books_library cb ON cb.id = b.canonical_book_id
    WHERE (b.catalog_status = 'archived' OR b.status = 'archived')
      AND (p_search IS NULL OR b.title ILIKE '%' || p_search || '%' OR b.author ILIKE '%' || p_search || '%' OR b.archive_reason ILIKE '%' || p_search || '%')
      AND (p_classification IS NULL OR b.archive_classification = p_classification OR a.archive_classification = p_classification)
    ORDER BY COALESCE(b.archived_at, a.archived_at) DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
