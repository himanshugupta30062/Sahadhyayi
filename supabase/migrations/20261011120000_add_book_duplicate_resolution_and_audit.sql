-- Migration: 20261011120000_add_book_duplicate_resolution_and_audit.sql
-- Description: Add catalog quality tracking, soft-archiving, duplicate resolution audit logs and transactional resolution RPC

-- 1. Extend books_library with status and lineage columns
ALTER TABLE public.books_library
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'superseded', 'junk')),
  ADD COLUMN IF NOT EXISTS superseded_by_id uuid REFERENCES public.books_library(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duplicate_group_id text,
  ADD COLUMN IF NOT EXISTS archive_reason text,
  ADD COLUMN IF NOT EXISTS quality_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_audited_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_books_library_status ON public.books_library(status);
CREATE INDEX IF NOT EXISTS idx_books_library_superseded_by ON public.books_library(superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_books_library_duplicate_group ON public.books_library(duplicate_group_id);

-- 2. Create audit log table for duplicate resolutions
CREATE TABLE IF NOT EXISTS public.book_duplicate_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  group_id text NOT NULL,
  primary_book_id uuid REFERENCES public.books_library(id) ON DELETE SET NULL,
  affected_book_ids uuid[] NOT NULL DEFAULT '{}',
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_book_duplicate_audit_group ON public.book_duplicate_audit_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_book_duplicate_audit_primary ON public.book_duplicate_audit_logs(primary_book_id);

ALTER TABLE public.book_duplicate_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view or insert audit logs
CREATE POLICY "Admins can view duplicate audit logs"
  ON public.book_duplicate_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert duplicate audit logs"
  ON public.book_duplicate_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 3. Transactional Duplicate Resolution RPC
CREATE OR REPLACE FUNCTION public.resolve_duplicate_book_group(
  p_group_id text,
  p_action text,
  p_primary_id uuid,
  p_duplicate_ids uuid[],
  p_reason text DEFAULT NULL,
  p_merge_metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_is_admin boolean;
  v_dup_id uuid;
  v_migrated_shelves integer := 0;
  v_migrated_progress integer := 0;
  v_migrated_rooms integer := 0;
  v_migrated_notes integer := 0;
  v_archived_count integer := 0;
  v_snapshot jsonb;
  v_before_records jsonb;
BEGIN
  -- 1. Authorization check
  v_caller_is_admin := public.is_admin();
  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: only administrators can execute duplicate book resolution';
  END IF;

  -- 2. Validate primary book exists and is active
  IF p_primary_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.books_library WHERE id = p_primary_id) THEN
    RAISE EXCEPTION 'Primary book % does not exist', p_primary_id;
  END IF;

  -- 3. Capture before-snapshot of records for audit & restore capability
  SELECT json_agg(to_jsonb(b)) INTO v_before_records
  FROM public.books_library b
  WHERE b.id = p_primary_id OR b.id = ANY(p_duplicate_ids);

  v_snapshot := jsonb_build_object(
    'before_records', COALESCE(v_before_records, '[]'::jsonb),
    'primary_id', p_primary_id,
    'duplicate_ids', p_duplicate_ids,
    'action', p_action,
    'reason', p_reason
  );

  -- 4. Execute metadata merge if specified
  IF p_primary_id IS NOT NULL AND p_merge_metadata IS NOT NULL THEN
    UPDATE public.books_library
    SET
      description = COALESCE(NULLIF(description, ''), p_merge_metadata->>'description', description),
      cover_image_url = COALESCE(NULLIF(cover_image_url, ''), p_merge_metadata->>'cover_image_url', cover_image_url),
      isbn = COALESCE(NULLIF(isbn, ''), p_merge_metadata->>'isbn', isbn),
      publication_year = COALESCE(publication_year, (p_merge_metadata->>'publication_year')::integer),
      pages = COALESCE(pages, (p_merge_metadata->>'pages')::integer),
      pdf_url = COALESCE(NULLIF(pdf_url, ''), p_merge_metadata->>'pdf_url', pdf_url),
      author_bio = COALESCE(NULLIF(author_bio, ''), p_merge_metadata->>'author_bio', author_bio),
      genre = COALESCE(NULLIF(genre, ''), p_merge_metadata->>'genre', genre)
    WHERE id = p_primary_id;
  END IF;

  -- 5. Safe foreign-key re-parenting for each duplicate row
  IF p_primary_id IS NOT NULL AND array_length(p_duplicate_ids, 1) > 0 THEN
    FOREACH v_dup_id IN ARRAY p_duplicate_ids LOOP
      IF v_dup_id = p_primary_id THEN
        CONTINUE;
      END IF;

      -- user_bookshelf: resolve UNIQUE(user_id, book_id)
      -- For users who already have p_primary_id in their shelf: merge notes/rating if empty, delete dup entry
      UPDATE public.user_bookshelf ub_pri
      SET
        notes = COALESCE(NULLIF(ub_pri.notes, ''), ub_dup.notes),
        rating = COALESCE(ub_pri.rating, ub_dup.rating)
      FROM public.user_bookshelf ub_dup
      WHERE ub_dup.book_id = v_dup_id
        AND ub_pri.book_id = p_primary_id
        AND ub_pri.user_id = ub_dup.user_id;

      DELETE FROM public.user_bookshelf
      WHERE book_id = v_dup_id
        AND user_id IN (
          SELECT user_id FROM public.user_bookshelf WHERE book_id = p_primary_id
        );

      -- For users who don't have p_primary_id yet, update book_id to p_primary_id
      UPDATE public.user_bookshelf
      SET book_id = p_primary_id
      WHERE book_id = v_dup_id;
      GET DIAGNOSTICS v_migrated_shelves = ROW_COUNT;

      -- user_personal_library: resolve UNIQUE(user_id, book_id)
      DELETE FROM public.user_personal_library
      WHERE book_id = v_dup_id
        AND user_id IN (
          SELECT user_id FROM public.user_personal_library WHERE book_id = p_primary_id
        );

      UPDATE public.user_personal_library
      SET book_id = p_primary_id
      WHERE book_id = v_dup_id;

      -- reading_progress: resolve UNIQUE(user_id, book_id)
      -- Keep whichever has greater current_page
      UPDATE public.reading_progress rp_pri
      SET
        current_page = GREATEST(rp_pri.current_page, rp_dup.current_page),
        total_pages = COALESCE(rp_pri.total_pages, rp_dup.total_pages),
        cover_image_url = COALESCE(rp_pri.cover_image_url, rp_dup.cover_image_url)
      FROM public.reading_progress rp_dup
      WHERE rp_dup.book_id = v_dup_id
        AND rp_pri.book_id = p_primary_id
        AND rp_pri.user_id = rp_dup.user_id;

      DELETE FROM public.reading_progress
      WHERE book_id = v_dup_id
        AND user_id IN (
          SELECT user_id FROM public.reading_progress WHERE book_id = p_primary_id
        );

      UPDATE public.reading_progress
      SET book_id = p_primary_id
      WHERE book_id = v_dup_id;
      GET DIAGNOSTICS v_migrated_progress = ROW_COUNT;

      -- margin_notes: re-parent safely (no unique constraint on book_id)
      UPDATE public.margin_notes
      SET book_id = p_primary_id
      WHERE book_id = v_dup_id;
      GET DIAGNOSTICS v_migrated_notes = ROW_COUNT;

      -- spoiler_threads: re-parent safely
      UPDATE public.spoiler_threads
      SET book_id = p_primary_id
      WHERE book_id = v_dup_id;

      -- posts: re-parent safely
      UPDATE public.posts
      SET book_id = p_primary_id
      WHERE book_id = v_dup_id;

      -- reading_rooms: handle UNIQUE(book_id)
      IF EXISTS (SELECT 1 FROM public.reading_rooms WHERE book_id = p_primary_id) THEN
        -- Room for primary already exists; re-parent room messages if any, then delete dup room
        UPDATE public.reading_room_messages
        SET room_id = (SELECT id FROM public.reading_rooms WHERE book_id = p_primary_id LIMIT 1)
        WHERE room_id IN (SELECT id FROM public.reading_rooms WHERE book_id = v_dup_id);

        DELETE FROM public.reading_rooms WHERE book_id = v_dup_id;
      ELSE
        UPDATE public.reading_rooms
        SET book_id = p_primary_id
        WHERE book_id = v_dup_id;
      END IF;
      GET DIAGNOSTICS v_migrated_rooms = ROW_COUNT;

      -- 6. Apply soft-archive or supersede on duplicate record
      IF p_action = 'archive_junk' THEN
        UPDATE public.books_library
        SET
          status = 'junk',
          superseded_by_id = p_primary_id,
          duplicate_group_id = p_group_id,
          archive_reason = COALESCE(p_reason, 'Flagged as unusable placeholder/junk record'),
          last_audited_at = now()
        WHERE id = v_dup_id;
      ELSE
        UPDATE public.books_library
        SET
          status = 'superseded',
          superseded_by_id = p_primary_id,
          duplicate_group_id = p_group_id,
          archive_reason = COALESCE(p_reason, 'Superseded by higher quality edition ' || p_primary_id::text),
          last_audited_at = now()
        WHERE id = v_dup_id;
      END IF;

      v_archived_count := v_archived_count + 1;
    END LOOP;

    -- Update primary book metadata with audit stamp
    UPDATE public.books_library
    SET
      status = 'active',
      duplicate_group_id = p_group_id,
      last_audited_at = now()
    WHERE id = p_primary_id;
  END IF;

  -- 7. Record entry in audit log
  INSERT INTO public.book_duplicate_audit_logs (
    action,
    group_id,
    primary_book_id,
    affected_book_ids,
    performed_by,
    reason,
    snapshot
  ) VALUES (
    p_action,
    p_group_id,
    p_primary_id,
    p_duplicate_ids,
    auth.uid(),
    p_reason,
    v_snapshot
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'group_id', p_group_id,
    'primary_id', p_primary_id,
    'archived_count', v_archived_count,
    'migrated_shelves', v_migrated_shelves,
    'migrated_progress', v_migrated_progress,
    'migrated_notes', v_migrated_notes,
    'timestamp', now()
  );
END;
$$;

-- 4. Restore archived record RPC (Idempotent Undo)
CREATE OR REPLACE FUNCTION public.restore_archived_book(
  p_book_id uuid,
  p_reason text DEFAULT 'Restored by administrator'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_is_admin boolean;
BEGIN
  v_caller_is_admin := public.is_admin();
  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: only administrators can restore books';
  END IF;

  UPDATE public.books_library
  SET
    status = 'active',
    superseded_by_id = NULL,
    archive_reason = NULL,
    last_audited_at = now()
  WHERE id = p_book_id;

  INSERT INTO public.book_duplicate_audit_logs (
    action,
    group_id,
    primary_book_id,
    affected_book_ids,
    performed_by,
    reason,
    snapshot
  ) VALUES (
    'restore_archived_record',
    'restore-' || p_book_id::text,
    p_book_id,
    ARRAY[p_book_id],
    auth.uid(),
    p_reason,
    jsonb_build_object('restored_book_id', p_book_id)
  );

  RETURN jsonb_build_object('success', true, 'book_id', p_book_id, 'status', 'active');
END;
$$;

