-- Persistent, evidence-backed book asset quality and ranking fields.
-- Scores remain NULL until an actual verifier has inspected the asset.
ALTER TABLE public.books_library
  ADD COLUMN IF NOT EXISTS cover_quality_score smallint,
  ADD COLUMN IF NOT EXISTS pdf_quality_score smallint,
  ADD COLUMN IF NOT EXISTS metadata_match_score smallint,
  ADD COLUMN IF NOT EXISTS asset_quality_score smallint,
  ADD COLUMN IF NOT EXISTS asset_quality_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS asset_quality_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS asset_quality_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS asset_quality_version integer NOT NULL DEFAULT 1;

ALTER TABLE public.books_library
  DROP CONSTRAINT IF EXISTS books_library_cover_quality_score_range,
  ADD CONSTRAINT books_library_cover_quality_score_range CHECK (cover_quality_score IS NULL OR cover_quality_score BETWEEN 0 AND 100),
  DROP CONSTRAINT IF EXISTS books_library_pdf_quality_score_range,
  ADD CONSTRAINT books_library_pdf_quality_score_range CHECK (pdf_quality_score IS NULL OR pdf_quality_score BETWEEN 0 AND 100),
  DROP CONSTRAINT IF EXISTS books_library_metadata_match_score_range,
  ADD CONSTRAINT books_library_metadata_match_score_range CHECK (metadata_match_score IS NULL OR metadata_match_score BETWEEN 0 AND 100),
  DROP CONSTRAINT IF EXISTS books_library_asset_quality_score_range,
  ADD CONSTRAINT books_library_asset_quality_score_range CHECK (asset_quality_score IS NULL OR asset_quality_score BETWEEN 0 AND 100),
  DROP CONSTRAINT IF EXISTS books_library_asset_quality_status_check,
  ADD CONSTRAINT books_library_asset_quality_status_check CHECK (asset_quality_status IN ('pending','verified','needs_review','failed'));

CREATE INDEX IF NOT EXISTS idx_books_library_asset_quality_rank
  ON public.books_library (asset_quality_score DESC NULLS LAST, created_at DESC)
  WHERE asset_quality_status = 'verified';

COMMENT ON COLUMN public.books_library.asset_quality_evidence IS
  'Evidence from automated cover/PDF checks: HTTP status, MIME/signature, dimensions, PDF parse/page/text checks, OCR identity match, warnings and verifier version. Never store file contents or secrets.';
