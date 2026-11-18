# AI-assisted book PDF review workflow

## Components
- User contributions are stored only in the private `book-pdf-quarantine` bucket.
- `verify-book-pdf` authenticates the user, checks submission ownership (or admin role), validates the PDF signature/size, and asks Gemini for metadata/content-match signals. The report is advisory and the status remains `needs_review`.
- `review-book-pdf` provides a private PDF preview and one admin decision: approve (which publishes directly to the Library) or reject. Approval creates a new catalogue row when the submission does not target an existing book; no separate approve-then-publish workflow is required.
- `/admin/book-pdf-reviews` is the review queue. The legacy `/admin/book-pdfs` route is intentionally unchanged.

## Required secrets
- Existing Supabase Edge Function secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- `GEMINI_API_KEY` for the Gemini Files API.
- Optional `BOOK_PDF_GEMINI_MODEL` (defaults to `gemini-2.5-flash`).
- `PDF_MALWARE_SCAN_URL` and `PDF_MALWARE_SCAN_TOKEN` are required before public publishing is allowed.

## Malware scanner contract
The configured scanner endpoint must:
- Be an HTTPS endpoint controlled by the deployment operator.
- Accept a `POST` request with `Content-Type: application/pdf`, the PDF bytes as the body, and `Authorization: Bearer <token>`.
- Return a 2xx JSON response with `{ "clean": true }` only after the file has been scanned successfully.
- Return `clean: false` for malicious/suspicious files and non-2xx for scan failures.
Publishing fails closed when the endpoint or token is missing, the request times out, the response is invalid, or `clean` is not exactly `true`. Do not configure an arbitrary user-controlled URL as the scanner endpoint.

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
