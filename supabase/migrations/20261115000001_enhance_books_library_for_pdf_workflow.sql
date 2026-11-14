-- Phase 1: Enhance books_library with PDF workflow fields
-- This migration adds all necessary columns for the complete PDF contribution pipeline

BEGIN;

-- 1. Add status and catalog_status columns to books_library if not exist
ALTER TABLE public.books_library
  ADD COLUMN IF NOT EXISTS status TEXT
    CHECK (status IS NULL OR status IN ('active', 'archived', 'superseded', 'needs_review', 'draft')),
  ADD COLUMN IF NOT EXISTS catalog_status TEXT
    CHECK (catalog_status IS NULL OR catalog_status IN ('active', 'archived', 'superseded', 'needs_review')),
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pdf_verification_status TEXT
    CHECK (pdf_verification_status IS NULL OR pdf_verification_status IN ('pending', 'verified', 'failed', 'corrupted', 'malware_detected')),
  ADD COLUMN IF NOT EXISTS pdf_sha256 TEXT
    CHECK (pdf_sha256 IS NULL OR pdf_sha256 ~ '^[a-f0-9]{64}$'),
  ADD COLUMN IF NOT EXISTS pdf_file_size BIGINT
    CHECK (pdf_file_size IS NULL OR pdf_file_size > 0),
  ADD COLUMN IF NOT EXISTS pdf_page_count INTEGER
    CHECK (pdf_page_count IS NULL OR pdf_page_count > 0),
  ADD COLUMN IF NOT EXISTS pdf_last_validated TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pdf_replaced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pdf_replaced_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Add unique constraint on pdf_sha256 to prevent duplicate PDFs
-- (Only for non-null values; multiple books can share same PDF if explicitly linked)
CREATE UNIQUE INDEX IF NOT EXISTS ux_books_library_pdf_sha256
  ON public.books_library (pdf_sha256)
  WHERE pdf_sha256 IS NOT NULL;

-- 3. Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_books_library_status
  ON public.books_library (status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_library_catalog_status
  ON public.books_library (catalog_status) WHERE catalog_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_library_is_archived
  ON public.books_library (is_archived);
CREATE INDEX IF NOT EXISTS idx_books_library_pdf_verification_status
  ON public.books_library (pdf_verification_status) WHERE pdf_verification_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_library_pdf_sha256
  ON public.books_library (pdf_sha256) WHERE pdf_sha256 IS NOT NULL;

-- 4. Enhanced book_pdf_submissions table
ALTER TABLE public.book_pdf_submissions
  ADD COLUMN IF NOT EXISTS pdf_sha256 TEXT
    CHECK (pdf_sha256 IS NULL OR pdf_sha256 ~ '^[a-f0-9]{64}$'),
  ADD COLUMN IF NOT EXISTS malware_scan_status TEXT
    CHECK (malware_scan_status IS NULL OR malware_scan_status IN ('pending', 'scanning', 'clean', 'suspicious', 'malicious', 'failed', 'timeout')),
  ADD COLUMN IF NOT EXISTS malware_scan_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS malware_scan_details JSONB
    CHECK (jsonb_typeof(malware_scan_details) = 'object'),
  ADD COLUMN IF NOT EXISTS catalogue_match_status TEXT
    CHECK (catalogue_match_status IS NULL OR catalogue_match_status IN ('auto_matched', 'admin_selected', 'new_created', 'ambiguous', 'no_match')),
  ADD COLUMN IF NOT EXISTS admin_notes TEXT
    CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 5000),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publication_error TEXT
    CHECK (publication_error IS NULL OR char_length(publication_error) <= 2000);

-- 5. Add unique constraint on pdf_sha256 for submissions (prevent duplicate uploads)
CREATE UNIQUE INDEX IF NOT EXISTS ux_book_pdf_submissions_pdf_sha256
  ON public.book_pdf_submissions (pdf_sha256)
  WHERE pdf_sha256 IS NOT NULL;

-- 6. Add indexes for submissions
CREATE INDEX IF NOT EXISTS idx_book_pdf_submissions_pdf_sha256
  ON public.book_pdf_submissions (pdf_sha256) WHERE pdf_sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_book_pdf_submissions_malware_status
  ON public.book_pdf_submissions (malware_scan_status) WHERE malware_scan_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_book_pdf_submissions_catalogue_match
  ON public.book_pdf_submissions (catalogue_match_status) WHERE catalogue_match_status IS NOT NULL;

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 8. Add updated_at trigger to books_library if not exists
DROP TRIGGER IF EXISTS update_books_library_updated_at ON public.books_library;
CREATE TRIGGER update_books_library_updated_at
  BEFORE UPDATE ON public.books_library
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Add updated_at trigger to book_pdf_submissions if not exists
DROP TRIGGER IF EXISTS update_book_pdf_submissions_updated_at ON public.book_pdf_submissions;
CREATE TRIGGER update_book_pdf_submissions_updated_at
  BEFORE UPDATE ON public.book_pdf_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. Create RPC: match_catalogue_book - Find candidate books for a PDF submission
CREATE OR REPLACE FUNCTION public.match_catalogue_book(
  p_title TEXT,
  p_author TEXT,
  p_isbn TEXT DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  author TEXT,
  isbn TEXT,
  pdf_url TEXT,
  publication_year INT,
  language TEXT,
  cover_image_url TEXT,
  match_score NUMERIC,
  match_reasons TEXT[]
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  title_tokens TEXT[];
  author_tokens TEXT[];
  query_text TEXT;
BEGIN
  -- Normalize and tokenize input
  title_tokens := regexp_split_to_array(lower(regexp_replace(p_title, '[^a-z0-9\s]', '', 'g')), '\s+');
  author_tokens := regexp_split_to_array(lower(regexp_replace(p_author, '[^a-z0-9\s]', '', 'g')), '\s+');

  -- Build search query
  query_text := lower(p_title) || ' ' || lower(p_author);
  IF p_isbn IS NOT NULL THEN
    query_text := query_text || ' ' || p_isbn;
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.author,
    b.isbn,
    b.pdf_url,
    b.publication_year,
    b.language,
    b.cover_image_url,
    -- Calculate match score
    (
      -- Title similarity (0-1)
      CASE WHEN lower(b.title) = lower(p_title) THEN 1.0
           WHEN lower(b.title) ILIKE '%' || lower(p_title) || '%' THEN 0.8
           WHEN EXISTS (
             SELECT 1 FROM unnest(title_tokens) t(tok)
             WHERE lower(b.title) ILIKE '%' || tok || '%'
           ) THEN 0.5
           ELSE 0.0 END
      +
      -- Author similarity (0-1)
      CASE WHEN lower(b.author) = lower(p_author) THEN 1.0
           WHEN lower(b.author) ILIKE '%' || lower(p_author) || '%' THEN 0.8
           WHEN EXISTS (
             SELECT 1 FROM unnest(author_tokens) t(tok)
             WHERE lower(b.author) ILIKE '%' || tok || '%'
           ) THEN 0.5
           ELSE 0.0 END
      +
      -- ISBN exact match (2.0 bonus)
      CASE WHEN p_isbn IS NOT NULL AND b.isbn = p_isbn THEN 2.0 ELSE 0.0 END
    ) AS match_score,
    -- Explain match reasons
    ARRAY(
      SELECT reason FROM (VALUES
        (CASE WHEN lower(b.title) = lower(p_title) THEN 'exact_title_match' END),
        (CASE WHEN lower(b.title) ILIKE '%' || lower(p_title) || '%' THEN 'title_contains' END),
        (CASE WHEN lower(b.author) = lower(p_author) THEN 'exact_author_match' END),
        (CASE WHEN lower(b.author) ILIKE '%' || lower(p_author) || '%' THEN 'author_contains' END),
        (CASE WHEN p_isbn IS NOT NULL AND b.isbn = p_isbn THEN 'exact_isbn_match' END)
      ) AS v(reason)
      WHERE v.reason IS NOT NULL
    ) AS match_reasons
  FROM public.books_library b
  WHERE b.is_archived = FALSE
    AND (b.catalog_status IS NULL OR b.catalog_status = 'active')
    AND (b.status IS NULL OR b.status = 'active')
    AND (
      lower(b.title) ILIKE '%' || lower(p_title) || '%'
      OR lower(b.author) ILIKE '%' || lower(p_author) || '%'
      OR (p_isbn IS NOT NULL AND b.isbn = p_isbn)
    )
  ORDER BY match_score DESC, b.title
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_catalogue_book TO authenticated;

-- 11. Create RPC: auto_associate_pdf - Attempt automatic catalogue association
CREATE OR REPLACE FUNCTION public.auto_associate_pdf(
  p_submission_id UUID,
  p_min_confidence NUMERIC DEFAULT 0.9
)
RETURNS TABLE (
  book_id UUID,
  title TEXT,
  author TEXT,
  match_score NUMERIC,
  is_exact_match BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_submission RECORD;
  v_matches RECORD;
BEGIN
  -- Get submission with detected metadata
  SELECT * INTO v_submission
  FROM public.book_pdf_submissions
  WHERE id = p_submission_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- If already has a target_book_id from user selection, verify it exists and has no PDF
  IF v_submission.target_book_id IS NOT NULL THEN
    SELECT id, title, author, pdf_url
    INTO v_matches
    FROM public.books_library
    WHERE id = v_submission.target_book_id
      AND is_archived = FALSE
      AND (catalog_status IS NULL OR catalog_status = 'active')
      AND (status IS NULL OR status = 'active');

    IF FOUND AND v_matches.pdf_url IS NULL THEN
      RETURN QUERY SELECT v_matches.id, v_matches.title, v_matches.author, 1.0::NUMERIC, TRUE;
      RETURN;
    END IF;
  END IF;

  -- Use detected metadata from Gemini if available
  DECLARE
    v_detected_title TEXT := v_submission.detected_metadata->>'detected_title';
    v_detected_author TEXT := v_submission.detected_metadata->>'detected_author';
  BEGIN
    IF v_detected_title IS NOT NULL AND v_detected_title <> '' THEN
      -- Search for matches using the match_catalogue_book function
      FOR v_matches IN
        SELECT * FROM public.match_catalogue_book(
          v_detected_title,
          v_detected_author,
          NULL,
          5
        )
      LOOP
        -- Only consider books without existing PDF
        IF v_matches.pdf_url IS NULL THEN
          -- Check if match score meets minimum confidence
          IF v_matches.match_score >= p_min_confidence * 2.0 THEN -- max possible score is ~4.0
            -- Update submission with catalogue match info
            UPDATE public.book_pdf_submissions
            SET catalogue_match_status = 'auto_matched',
                target_book_id = v_matches.id,
                match_confidence = LEAST(v_matches.match_score / 4.0, 1.0)
            WHERE id = p_submission_id;

            RETURN QUERY SELECT v_matches.id, v_matches.title, v_matches.author, v_matches.match_score,
              (v_matches.match_score >= 3.5) AS is_exact_match;
            RETURN;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END;

  -- No confident match found
  UPDATE public.book_pdf_submissions
  SET catalogue_match_status = 'no_match'
  WHERE id = p_submission_id;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_associate_pdf TO authenticated;

-- 12. Create RPC: delete_pdf_safely - Admin-only PDF deletion with audit
CREATE OR REPLACE FUNCTION public.delete_pdf_safely(
  p_book_id UUID,
  p_admin_user_id UUID,
  p_reason TEXT DEFAULT 'Admin deletion'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  deleted_storage_path TEXT,
  previous_pdf_url TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_book RECORD;
  v_storage_path TEXT;
  v_audit_id UUID;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) THEN
    RETURN QUERY SELECT FALSE, 'Admin authorization required', NULL, NULL;
  END IF;

  -- Get book and current PDF
  SELECT id, title, pdf_url INTO v_book
  FROM public.books_library
  WHERE id = p_book_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Book not found', NULL, NULL;
  END IF;

  IF v_book.pdf_url IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Book has no PDF to delete', NULL, NULL;
  END IF;

  -- Extract storage path from public URL
  -- Format: https://xxx.supabase.co/storage/v1/object/public/book-pdfs/{book_id}/{filename}.pdf
  v_storage_path := regexp_replace(v_book.pdf_url, '^.*/book-pdfs/', '');

  -- Delete from storage (best effort)
  PERFORM storage.remove('book-pdfs', ARRAY[v_storage_path]);

  -- Store previous URL for audit
  DECLARE v_previous_url TEXT := v_book.pdf_url;

  -- Update book: clear PDF fields
  UPDATE public.books_library
  SET pdf_url = NULL,
      pdf_sha256 = NULL,
      pdf_file_size = NULL,
      pdf_page_count = NULL,
      pdf_last_validated = NULL,
      pdf_verification_status = NULL,
      pdf_replaced_at = NOW(),
      pdf_replaced_by = p_admin_user_id
  WHERE id = p_book_id;

  -- Create audit record
  INSERT INTO public.book_pdf_admin_audit (
    book_id,
    previous_pdf_url,
    pdf_url,
    source_url,
    rights_basis,
    rights_notes,
    file_name,
    file_size_bytes,
    uploaded_by
  ) VALUES (
    p_book_id,
    v_previous_url,
    NULL,
    'deleted',
    'public_domain',
    'PDF deleted by admin: ' || p_reason,
    split_part(v_storage_path, '/', 2),
    0,
    p_admin_user_id
  ) RETURNING id INTO v_audit_id;

  -- Also log in review audit if submission exists
  INSERT INTO public.book_pdf_review_audit (
    submission_id,
    reviewer_id,
    action,
    reason,
    details
  )
  SELECT id, p_admin_user_id, 'rejected', p_reason,
    jsonb_build_object(
      'deleted_book_id', p_book_id,
      'deleted_pdf_url', v_previous_url,
      'audit_id', v_audit_id
    )
  FROM public.book_pdf_submissions
  WHERE published_book_id = p_book_id;

  RETURN QUERY SELECT TRUE, 'PDF deleted successfully', v_storage_path, v_previous_url;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_pdf_safely TO authenticated;

-- 13. Create RPC: replace_pdf - Admin PDF replacement with transactional safety
CREATE OR REPLACE FUNCTION public.replace_pdf(
  p_book_id UUID,
  p_new_storage_path TEXT,
  p_admin_user_id UUID,
  p_rights_basis TEXT,
  p_rights_notes TEXT,
  p_source_url TEXT,
  p_file_name TEXT,
  p_file_size BIGINT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_pdf_url TEXT,
  previous_pdf_url TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_book RECORD;
  v_new_pdf_url TEXT;
  v_previous_pdf_url TEXT;
  v_audit_id UUID;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) THEN
    RETURN QUERY SELECT FALSE, 'Admin authorization required', NULL, NULL;
  END IF;

  -- Get book
  SELECT id, title, pdf_url INTO v_book
  FROM public.books_library
  WHERE id = p_book_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Book not found', NULL, NULL;
  END IF;

  v_previous_pdf_url := v_book.pdf_url;

  -- Generate new public URL
  v_new_pdf_url := (
    SELECT public_url FROM storage.get_public_url('book-pdfs', p_new_storage_path)
  ).public_url;

  -- Update book with new PDF
  UPDATE public.books_library
  SET pdf_url = v_new_pdf_url,
      pdf_replaced_at = NOW(),
      pdf_replaced_by = p_admin_user_id
  WHERE id = p_book_id;

  -- Create audit record
  INSERT INTO public.book_pdf_admin_audit (
    book_id,
    previous_pdf_url,
    pdf_url,
    source_url,
    rights_basis,
    rights_notes,
    file_name,
    file_size_bytes,
    uploaded_by
  ) VALUES (
    p_book_id,
    v_previous_pdf_url,
    v_new_pdf_url,
    p_source_url,
    p_rights_basis,
    p_rights_notes,
    p_file_name,
    p_file_size,
    p_admin_user_id
  ) RETURNING id INTO v_audit_id;

  -- Delete old storage object if it existed (best effort)
  IF v_previous_pdf_url IS NOT NULL THEN
    DECLARE v_old_path TEXT := regexp_replace(v_previous_pdf_url, '^.*/book-pdfs/', '');
    PERFORM storage.remove('book-pdfs', ARRAY[v_old_path]);
  END IF;

  RETURN QUERY SELECT TRUE, 'PDF replaced successfully', v_new_pdf_url, v_previous_pdf_url;
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_pdf TO authenticated;

-- 14. Create RPC: validate_pdf_url - Check if a PDF URL is accessible and valid
CREATE OR REPLACE FUNCTION public.validate_pdf_url(
  p_pdf_url TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  content_type TEXT,
  content_length BIGINT,
  error_message TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- This function is a placeholder for client-side validation
  -- Actual validation happens in Edge Functions
  IF p_pdf_url IS NULL OR p_pdf_url = '' THEN
    RETURN QUERY SELECT FALSE, NULL, NULL, 'URL is empty';
  END IF;

  IF NOT (p_pdf_url ILIKE 'https://%' OR p_pdf_url ILIKE 'http://%') THEN
    RETURN QUERY SELECT FALSE, NULL, NULL, 'Invalid URL protocol';
  END IF;

  RETURN QUERY SELECT TRUE, 'application/pdf', NULL, NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_pdf_url TO authenticated;

-- 15. Create RPC: get_pdf_audit_trail - Get complete audit history for a book's PDF
CREATE OR REPLACE FUNCTION public.get_pdf_audit_trail(
  p_book_id UUID
)
RETURNS TABLE (
  id UUID,
  action TEXT,
  previous_pdf_url TEXT,
  pdf_url TEXT,
  source_url TEXT,
  rights_basis TEXT,
  rights_notes TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  uploaded_by UUID,
  uploaded_by_email TEXT,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    'admin_upload'::TEXT AS action,
    a.previous_pdf_url,
    a.pdf_url,
    a.source_url,
    a.rights_basis,
    a.rights_notes,
    a.file_name,
    a.file_size_bytes,
    a.uploaded_by,
    u.email AS uploaded_by_email,
    a.created_at
  FROM public.book_pdf_admin_audit a
  LEFT JOIN auth.users u ON u.id = a.uploaded_by
  WHERE a.book_id = p_book_id
  ORDER BY a.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pdf_audit_trail TO authenticated;

-- 16. Create trigger to clean up quarantine files when submission is rejected
CREATE OR REPLACE FUNCTION public.cleanup_quarantine_on_rejection()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only clean up if status changed to rejected and there's a storage path
  IF NEW.status = 'rejected' AND OLD.status <> 'rejected' AND NEW.storage_path IS NOT NULL THEN
    -- Best effort removal - don't fail the transaction if storage is unavailable
    PERFORM storage.remove('book-pdf-quarantine', ARRAY[NEW.storage_path]);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_cleanup_quarantine_on_rejection ON public.book_pdf_submissions;
CREATE TRIGGER trigger_cleanup_quarantine_on_rejection
  AFTER UPDATE OF status ON public.book_pdf_submissions
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_quarantine_on_rejection();

-- 17. Create trigger to prevent duplicate pdf_sha256 in submissions
CREATE OR REPLACE FUNCTION public.prevent_duplicate_submission_sha256()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.pdf_sha256 IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.book_pdf_submissions
      WHERE pdf_sha256 = NEW.pdf_sha256
        AND id <> NEW.id
        AND status NOT IN ('rejected', 'failed')
    ) THEN
      RAISE EXCEPTION 'A submission with this PDF content already exists (duplicate SHA-256)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_duplicate_submission_sha256 ON public.book_pdf_submissions;
CREATE TRIGGER trigger_prevent_duplicate_submission_sha256
  BEFORE INSERT OR UPDATE OF pdf_sha256 ON public.book_pdf_submissions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_submission_sha256();

COMMIT;