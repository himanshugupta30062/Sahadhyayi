-- Additive review metadata for the private PDF contribution workflow.
-- Apply only to a disposable/test Supabase project until security review is complete.
BEGIN;

ALTER TABLE public.book_pdf_submissions
  ADD COLUMN IF NOT EXISTS rights_basis text
    CHECK (rights_basis IS NULL OR rights_basis IN ('public_domain', 'open_license', 'rights_holder', 'written_permission', 'official_source', 'unknown')),
  ADD COLUMN IF NOT EXISTS rights_evidence_url text
    CHECK (rights_evidence_url IS NULL OR char_length(rights_evidence_url) <= 2048),
  ADD COLUMN IF NOT EXISTS verification_model text
    CHECK (verification_model IS NULL OR char_length(verification_model) <= 120),
  ADD COLUMN IF NOT EXISTS verification_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_book_id uuid NULL REFERENCES public.books_library(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.book_pdf_review_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.book_pdf_submissions(id) ON DELETE CASCADE,
  reviewer_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('verification_started', 'verification_completed', 'approved', 'rejected', 'changes_requested', 'published')),
  reason text NULL CHECK (reason IS NULL OR char_length(reason) <= 2000),
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_book_pdf_review_audit_submission
  ON public.book_pdf_review_audit (submission_id, created_at DESC);

ALTER TABLE public.book_pdf_review_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view PDF review audit" ON public.book_pdf_review_audit;
CREATE POLICY "Admins can view PDF review audit"
  ON public.book_pdf_review_audit FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::text));

-- No client insert/update/delete policies: trusted Edge Functions own audit writes.
COMMIT;
