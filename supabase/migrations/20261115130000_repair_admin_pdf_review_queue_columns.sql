-- Repair admin PDF review queue SELECT columns missing from older submission schema.
-- Additive and safe for existing submissions.
ALTER TABLE public.book_pdf_submissions
  ADD COLUMN IF NOT EXISTS pdf_sha256 text,
  ADD COLUMN IF NOT EXISTS pdf_page_count integer,
  ADD COLUMN IF NOT EXISTS malware_scan_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS catalogue_match_status text,
  ADD COLUMN IF NOT EXISTS author_publication_id uuid;
