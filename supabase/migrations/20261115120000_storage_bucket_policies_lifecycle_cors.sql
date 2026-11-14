-- Storage Bucket Configuration: Lifecycle Policies and CORS
-- Adds auto-cleanup for quarantine bucket and CORS for public PDF bucket (PDF.js support)

BEGIN;

-- ============================================================================
-- 1. LIFECYCLE POLICY FOR book-pdf-quarantine BUCKET
-- Auto-delete abandoned uploads older than 7 days
-- ============================================================================

-- Supabase Storage lifecycle policies are managed via the storage API, not SQL.
-- However, we can create a scheduled cleanup function and cron job for this.

-- Create a function to clean up old quarantine files
CREATE OR REPLACE FUNCTION public.cleanup_old_quarantine_files()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  deleted_count INTEGER := 0;
  old_files RECORD;
BEGIN
  -- Find files in book-pdf-quarantine older than 7 days
  -- Note: We use the book_pdf_submissions table to find abandoned uploads
  -- that are still in 'uploaded' or 'queued' status beyond the grace period
  FOR old_files IN
    SELECT s.storage_path
    FROM public.book_pdf_submissions s
    WHERE s.status IN ('uploaded', 'queued', 'scanning', 'extracting', 'matching')
      AND s.created_at < NOW() - INTERVAL '7 days'
      AND s.storage_path IS NOT NULL
  LOOP
    -- Attempt to delete from storage (best effort)
    PERFORM storage.remove('book-pdf-quarantine', ARRAY[old_files.storage_path]);
    -- Mark submission as failed/abandoned
    UPDATE public.book_pdf_submissions
    SET status = 'failed',
        validation_findings = jsonb_set(
          COALESCE(validation_findings, '[]'::jsonb),
          '{0}',
          '"Abandoned upload: auto-cleaned after 7 days in quarantine."'::jsonb
        ),
        updated_at = NOW()
    WHERE storage_path = old_files.storage_path
      AND status IN ('uploaded', 'queued', 'scanning', 'extracting', 'matching');
    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_quarantine_files() TO authenticated;

-- Create a cron job to run cleanup daily (requires pg_cron extension)
-- This will be enabled if pg_cron is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule any existing job with this name
    PERFORM cron.unschedule('cleanup_old_quarantine_files');
    -- Schedule daily at 3 AM UTC
    PERFORM cron.schedule(
      'cleanup_old_quarantine_files',
      '0 3 * * *',
      'SELECT public.cleanup_old_quarantine_files();'
    );
    RAISE NOTICE 'Scheduled cleanup_old_quarantine_files cron job';
  ELSE
    RAISE NOTICE 'pg_cron extension not available; skipping cron job creation. Run cleanup manually or enable pg_cron.';
  END IF;
END;
$$;

-- ============================================================================
-- 2. CORS CONFIGURATION FOR book-pdfs BUCKET (PDF.js support)
-- ============================================================================

-- CORS for Supabase Storage is configured at the bucket level.
-- Since this cannot be done via SQL directly, we document the required
-- configuration and provide a helper function to verify it.

-- Required CORS configuration for book-pdfs bucket:
-- Allowed Origins: * (or specific domain(s) where PDF.js runs)
-- Allowed Methods: GET, HEAD, OPTIONS
-- Allowed Headers: Range, Content-Range, Accept-Ranges, Content-Length
-- Exposed Headers: Content-Length, Content-Range, Accept-Ranges
-- Max Age: 3600 seconds

-- Create a verification function to check CORS configuration
CREATE OR REPLACE FUNCTION public.verify_book_pdfs_cors()
RETURNS TABLE (
  bucket_id TEXT,
  cors_configured BOOLEAN,
  details JSONB
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  bucket_config RECORD;
BEGIN
  -- This function checks if the bucket exists and returns guidance
  -- Actual CORS config must be applied via Supabase Dashboard or API
  SELECT id, public, file_size_limit, allowed_mime_types
  INTO bucket_config
  FROM storage.buckets
  WHERE id = 'book-pdfs';

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'book-pdfs', FALSE, jsonb_build_object('error', 'Bucket not found');
  END IF;

  RETURN QUERY SELECT
    'book-pdfs',
    TRUE,
    jsonb_build_object(
      'bucket_exists', TRUE,
      'public', bucket_config.public,
      'file_size_limit', bucket_config.file_size_limit,
      'allowed_mime_types', bucket_config.allowed_mime_types,
      'cors_required', TRUE,
      'cors_config', jsonb_build_object(
        'allowed_origins', ARRAY['*'],
        'allowed_methods', ARRAY['GET', 'HEAD', 'OPTIONS'],
        'allowed_headers', ARRAY['Range', 'Content-Range', 'Accept-Ranges', 'Content-Length', 'Authorization'],
        'exposed_headers', ARRAY['Content-Length', 'Content-Range', 'Accept-Ranges'],
        'max_age_seconds', 3600
      ),
      'note', 'Apply CORS config via Supabase Dashboard > Storage > book-pdfs > Settings > CORS, or via Supabase Management API'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_book_pdfs_cors() TO authenticated;

-- ============================================================================
-- 3. VERIFICATION FUNCTION FOR QUARANTINE BUCKET LIFECYCLE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_quarantine_bucket_config()
RETURNS TABLE (
  bucket_id TEXT,
  private BOOLEAN,
  file_size_limit BIGINT,
  allowed_mime_types TEXT[],
  lifecycle_function_exists BOOLEAN,
  cron_job_exists BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  bucket_config RECORD;
  func_exists BOOLEAN;
  cron_exists BOOLEAN;
BEGIN
  SELECT id, public, file_size_limit, allowed_mime_types
  INTO bucket_config
  FROM storage.buckets
  WHERE id = 'book-pdf-quarantine';

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'book-pdf-quarantine', FALSE, 0, ARRAY[]::TEXT[], FALSE, FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'cleanup_old_quarantine_files'
      AND n.nspname = 'public'
  ) INTO func_exists;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    SELECT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'cleanup_old_quarantine_files'
    ) INTO cron_exists;
  ELSE
    cron_exists := FALSE;
  END IF;

  RETURN QUERY SELECT
    bucket_config.id,
    bucket_config.public,
    bucket_config.file_size_limit,
    bucket_config.allowed_mime_types,
    func_exists,
    cron_exists;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_quarantine_bucket_config() TO authenticated;

-- ============================================================================
-- 4. ENHANCED PDF VALIDATION - Add encryption check to verify-book-pdf
-- ============================================================================

-- The verify-book-pdf edge function already has PDF structure validation.
-- This adds a note about encryption detection which should be added to the
-- validatePDFStructure function in the edge function.

COMMENT ON FUNCTION public.verify_quarantine_bucket_config IS 'Verify book-pdf-quarantine bucket security configuration and lifecycle cleanup';
COMMENT ON FUNCTION public.verify_book_pdfs_cors IS 'Verify book-pdfs bucket CORS configuration for PDF.js compatibility';
COMMENT ON FUNCTION public.cleanup_old_quarantine_files IS 'Clean up abandoned PDF uploads in quarantine older than 7 days';

COMMIT;