# AI-assisted book PDF review workflow

## Components
- User contributions are stored only in the private `book-pdf-quarantine` bucket.
- The contributor form validates the PDF signature and 50 MB size limit, then stores it privately with status `uploaded`. No Gemini verification or contributor rights-evidence form is required for this flow.
- `review-book-pdf` provides a private PDF preview and one admin decision: approve (which publishes directly to the Library) or reject. Approval creates a new catalogue row when the submission does not target an existing book; no separate approve-then-publish workflow is required.
- `/admin/book-pdf-reviews` is the review queue. The legacy `/admin/book-pdfs` route is intentionally unchanged.

## Required secrets
- Supabase Edge Function runtime secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- `BOUNCER_API_KEY` for the malware scan performed when an admin approves a PDF.
- Gemini is not required for this simplified admin approval flow; the admin inspects the PDF directly.

## File safety
- Uploads are limited to unencrypted PDF files up to 50 MB and remain in the private `book-pdf-quarantine` bucket until approval.
- The approval endpoint rechecks the PDF signature and structure, then requires Bouncer to return an explicit clean verdict.
- If the scanner is not configured, times out, or returns a non-clean verdict, publication stops and the PDF remains private.
- Admin authorization is checked server-side. Public upload and catalogue updates are rolled back if publication metadata cannot be saved.

## Rights and publishing
Gemini never decides copyright status. The admin opens the private preview and chooses Approve & Add to Library or Reject. Approval performs the file integrity checks and configured malware scan, then links the PDF to the contributor-selected catalogue entry or creates a new entry from the submitted title and author. There is no separate publishing screen or evidence-URL form.

## Test-only rollout
1. Apply migrations to a disposable/test Supabase project only.
2. Configure the Gemini key and a trusted malware-scanner endpoint in that test project.
3. Deploy both functions to the test project only.
4. Verify anonymous requests, invalid JWTs, cross-user submission IDs, non-admin review requests, corrupt PDFs, oversized files, Gemini timeout/malformed output, scanner missing/error/infected/clean results, rights evidence validation, existing-PDF no-overwrite, and publication rollback.
5. Run `npm run lint`, `npm test`, `npm run build`, and coverage on the exact PR commit.
6. Confirm existing library search, shelves, save flows, PDF proxy/reader, and Book Expert are unchanged.
7. Do not merge or deploy until CI and security review pass.
