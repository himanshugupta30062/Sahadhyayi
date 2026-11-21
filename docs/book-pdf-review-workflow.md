# Book PDF contribution and admin review workflow

## Components
- User contributions are stored only in the private `book-pdf-quarantine` bucket.
- The contributor form validates the PDF signature and 50 MB size limit, then stores it privately with status `uploaded`.
- `review-book-pdf` provides a private PDF preview. An administrator inspects the PDF and chooses Approve & Add to Library or Reject.
- Approval publishes the PDF directly to the Library. It creates a catalogue row when the submission does not target an existing book.
- `/admin/book-pdf-reviews` is the review queue. The legacy `/admin/book-pdfs` route is intentionally unchanged.

## Required secrets
- Supabase Edge Function runtime secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- No malware-scanner API key or external scanning service is required.

## PDF handling
- Uploaded PDFs remain private in quarantine until an administrator approves them.
- Malware scanning is intentionally not performed.
- The server still checks the PDF signature and basic structure and rejects corrupt or encrypted PDFs.
- Admin authorization is checked server-side. Public upload and catalogue updates are rolled back if publication metadata cannot be saved.
- The admin preview link is private and short-lived.

## Rights and publishing
The administrator is responsible for reviewing the PDF and confirming it is appropriate to publish. Approval links the PDF to the contributor-selected catalogue entry or creates a new entry from the submitted title and author. There is no separate publishing screen or scanner-dependent approval step.
