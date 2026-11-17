-- Evidence-backed, admin-only decisions for book SEO catalogue reviews.
-- Decisions are audit records only; this table never mutates books_library.
CREATE TABLE IF NOT EXISTS public.book_seo_review_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books_library(id) ON DELETE RESTRICT,
  audit_generated_at timestamptz NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_research')),
  evidence_url text,
  evidence_note text,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  review_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT book_seo_review_decisions_book_audit_unique UNIQUE (book_id, audit_generated_at),
  CONSTRAINT book_seo_review_decisions_evidence_url_check
    CHECK (evidence_url IS NULL OR evidence_url ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS idx_book_seo_review_decisions_audit
  ON public.book_seo_review_decisions (audit_generated_at, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_seo_review_decisions_book
  ON public.book_seo_review_decisions (book_id);

ALTER TABLE public.book_seo_review_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read book SEO review decisions" ON public.book_seo_review_decisions;
CREATE POLICY "Admins can read book SEO review decisions"
  ON public.book_seo_review_decisions FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can create book SEO review decisions" ON public.book_seo_review_decisions;
CREATE POLICY "Admins can create book SEO review decisions"
  ON public.book_seo_review_decisions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND reviewer_id = auth.uid());
DROP POLICY IF EXISTS "Admins can update book SEO review decisions" ON public.book_seo_review_decisions;
CREATE POLICY "Admins can update book SEO review decisions"
  ON public.book_seo_review_decisions FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin() AND reviewer_id = auth.uid());

REVOKE ALL ON TABLE public.book_seo_review_decisions FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.book_seo_review_decisions TO authenticated;
