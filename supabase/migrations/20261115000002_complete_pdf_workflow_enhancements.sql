-- Phase 2: Complete PDF Workflow Enhancements
-- This migration adds missing columns, fixes RLS policies, and completes the PDF contribution pipeline
-- Depends on: 20261115000001_enhance_books_library_for_pdf_workflow.sql

BEGIN;

-- ============================================================================
-- 1. ADD MISSING updated_at COLUMN TO books_library (required for trigger)
-- ============================================================================
ALTER TABLE public.books_library
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ============================================================================
-- 2. FIX RLS POLICIES ON books_library - Restrict write operations to admins only
-- ============================================================================
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated can add library books" ON public.books_library;
DROP POLICY IF EXISTS "Admins can update library books" ON public.books_library;
DROP POLICY IF EXISTS "Admins can delete library books" ON public.books_library;

-- Create corrected admin-only policies
CREATE POLICY "Admins can insert library books"
  ON public.books_library
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update library books"
  ON public.books_library
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete library books"
  ON public.books_library
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 3. ENSURE book_pdf_admin_audit HAS PROPER ADMIN-ONLY RLS (defensive)
-- ============================================================================
-- The table was created in 20261027120000_admin_book_pdf_manager.sql with admin policies
-- This reinforces them in case they were altered
ALTER TABLE public.book_pdf_admin_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read PDF audit records" ON public.book_pdf_admin_audit;
CREATE POLICY "Admins can read PDF audit records"
  ON public.book_pdf_admin_audit FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create PDF audit records" ON public.book_pdf_admin_audit;
CREATE POLICY "Admins can create PDF audit records"
  ON public.book_pdf_admin_audit FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND uploaded_by = (SELECT auth.uid()));

-- No UPDATE/DELETE policies for audit integrity

-- ============================================================================
-- 4. ENSURE book_pdf_review_audit HAS PROPER ADMIN-ONLY RLS (defensive)
-- ============================================================================
ALTER TABLE public.book_pdf_review_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view PDF review audit" ON public.book_pdf_review_audit;
CREATE POLICY "Admins can view PDF review audit"
  ON public.book_pdf_review_audit FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 5. ADD CATALOGUE MATCH STATUS VALUE 'new_created' IF MISSING
-- ============================================================================
-- The check constraint in 20261115000001 already includes 'new_created'
-- This is a safeguard in case the constraint needs updating
DO $$
BEGIN
  -- Check if constraint allows 'new_created'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'book_pdf_submissions'
      AND ccu.column_name = 'catalogue_match_status'
      AND cc.check_clause ILIKE '%new_created%'
  ) THEN
    -- Drop and recreate constraint with all values
    ALTER TABLE public.book_pdf_submissions
      DROP CONSTRAINT IF EXISTS book_pdf_submissions_catalogue_match_status_check;

    ALTER TABLE public.book_pdf_submissions
      ADD CONSTRAINT book_pdf_submissions_catalogue_match_status_check
      CHECK (catalogue_match_status IS NULL OR catalogue_match_status IN
        ('auto_matched', 'admin_selected', 'new_created', 'ambiguous', 'no_match'));
  END IF;
END;
$$;

-- ============================================================================
-- 6. ADD INDEX ON books_library FOR pdf_replaced_at (audit queries)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_books_library_pdf_replaced_at
  ON public.books_library (pdf_replaced_at) WHERE pdf_replaced_at IS NOT NULL;

-- ============================================================================
-- 7. ADD INDEX ON book_pdf_submissions FOR published_at
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_book_pdf_submissions_published_at
  ON public.book_pdf_submissions (published_at) WHERE published_at IS NOT NULL;

-- ============================================================================
-- 8. GRANT EXECUTE ON ALL RPC FUNCTIONS TO authenticated (defensive)
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.match_catalogue_book TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_associate_pdf TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_pdf_safely TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_pdf TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_pdf_url TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pdf_audit_trail TO authenticated;

-- ============================================================================
-- 9. ADD COMMENT DOCUMENTATION
-- ============================================================================
COMMENT ON COLUMN public.books_library.status IS 'Book lifecycle status: active, archived, superseded, needs_review, draft';
COMMENT ON COLUMN public.books_library.catalog_status IS 'Catalog visibility status: active, archived, superseded, needs_review';
COMMENT ON COLUMN public.books_library.is_archived IS 'Quick filter flag for archived books';
COMMENT ON COLUMN public.books_library.pdf_verification_status IS 'PDF validation state: pending, verified, failed, corrupted, malware_detected';
COMMENT ON COLUMN public.books_library.pdf_sha256 IS 'SHA-256 hash of PDF content for deduplication (unique partial index)';
COMMENT ON COLUMN public.books_library.pdf_file_size IS 'PDF file size in bytes';
COMMENT ON COLUMN public.books_library.pdf_page_count IS 'Number of pages in PDF';
COMMENT ON COLUMN public.books_library.pdf_last_validated IS 'Timestamp of last PDF validation check';
COMMENT ON COLUMN public.books_library.pdf_replaced_at IS 'Timestamp when PDF was last replaced';
COMMENT ON COLUMN public.books_library.pdf_replaced_by IS 'Admin user ID who last replaced the PDF';

COMMENT ON COLUMN public.book_pdf_submissions.pdf_sha256 IS 'SHA-256 hash of submitted PDF for deduplication';
COMMENT ON COLUMN public.book_pdf_submissions.malware_scan_status IS 'Malware scan state: pending, scanning, clean, suspicious, malicious, failed, timeout';
COMMENT ON COLUMN public.book_pdf_submissions.malware_scan_completed_at IS 'When malware scan finished';
COMMENT ON COLUMN public.book_pdf_submissions.malware_scan_details IS 'Detailed malware scan results (engine, threats, etc.)';
COMMENT ON COLUMN public.book_pdf_submissions.catalogue_match_status IS 'How submission was matched: auto_matched, admin_selected, new_created, ambiguous, no_match';
COMMENT ON COLUMN public.book_pdf_submissions.admin_notes IS 'Internal admin notes during review';
COMMENT ON COLUMN public.book_pdf_submissions.published_at IS 'Timestamp when submission was published to catalog';
COMMENT ON COLUMN public.book_pdf_submissions.publication_error IS 'Error message if publication failed';

COMMENT ON FUNCTION public.match_catalogue_book IS 'Find candidate catalogue books matching title/author/ISBN with similarity scores';
COMMENT ON FUNCTION public.auto_associate_pdf IS 'Automatically associate a PDF submission with an existing catalogue book';
COMMENT ON FUNCTION public.delete_pdf_safely IS 'Admin-only: Delete a book PDF with audit trail and storage cleanup';
COMMENT ON FUNCTION public.replace_pdf IS 'Admin-only: Replace a book PDF transactionally with audit';
COMMENT ON FUNCTION public.validate_pdf_url IS 'Validate a PDF URL format and accessibility (placeholder for Edge Function)';
COMMENT ON FUNCTION public.get_pdf_audit_trail IS 'Get complete PDF audit history for a book';

COMMIT;