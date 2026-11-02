# Research Paper Upload & Curation Plan

**Product:** Sahadhyayi — Research Papers  
**Status:** Implementation plan (not yet built)  
**Owner:** Sahadhyayi product + engineering  
**Dependency:** Existing OpenAlex discovery backend and the book-PDF submission/review workflow

## 1. Product goal

Let researchers, authors, institutions, and authorized contributors submit research papers to Sahadhyayi. Every submission must be checked for file safety, metadata quality, duplication, and redistribution rights before it becomes publicly visible.

This is a curation workflow, not a general-purpose file-sharing service. A paper can be listed with a DOI or publisher/repository link even when Sahadhyayi is not allowed to host its PDF.

## 2. User experience

### Contributor flow

1. A signed-in user opens **Submit a Research Paper** from the Research Papers page.
2. They choose one submission type:
   - **Add a paper link / DOI:** preferred for papers already hosted by a publisher, university, or trusted repository.
   - **Upload a PDF:** only when they are the author/rightsholder or can provide a licence or written permission that permits hosting and redistribution.
3. They enter or confirm title, author list, abstract, publication year, discipline, journal/conference, DOI, institution, ORCID (optional), source URL, and licence/rights basis.
4. For PDF uploads, the interface shows accepted file type/size, a rights declaration, and an explanation that submission is not immediate publication.
5. The contributor sees a private **My Submissions** list with statuses, reviewer feedback, and resubmission actions.

### Admin/editor flow

1. A dedicated **Research Paper Review Queue** shows submissions, age, contributor, DOI, file status, and review state.
2. The reviewer can open a short-lived private preview, inspect extracted metadata, view duplicate matches, and inspect rights evidence.
3. The reviewer may request changes, reject, or approve for publication.
4. Approval is not publication. The reviewer explicitly chooses whether to publish:
   - metadata + DOI / external landing-page link only; or
   - metadata + hosted PDF, but only after the licence/permission and file-safety checks pass.
5. Every action is recorded in an immutable-style audit history (append-only records; no user-facing edit/delete).

## 3. Publication and rights policy

- Never treat an OpenAlex open-access flag as blanket permission for Sahadhyayi to re-host a PDF. It is a discovery signal; confirm the actual licence and repository terms for the specific file.
- Accept hosted PDFs only when redistribution is explicitly allowed: public domain, a compatible open licence, author/rightsholder permission, or another documented authorization.
- When rights are unclear, do not upload or mirror the file. Publish metadata and link to the publisher or repository instead.
- Keep the source URL, licence identifier, evidence URL, reviewer decision, and decision timestamp with the record.
- Do not remove copyright notices or alter the submitted work. Show attribution, DOI, licence, and source alongside any hosted file.
- A contributor rights attestation is evidence from the submitter, not proof by itself. A human reviewer must inspect the evidence.

## 4. Backend architecture

Use the existing Supabase project and follow the patterns already used by the book-PDF submission workflow, but create research-paper-specific tables, buckets, functions, and admin pages. Do not reuse book tables or mix book and paper states.

### Database

Create these tables:

- `research_papers`: published catalogue record; unique normalized DOI where present, OpenAlex ID where present, title, abstract, authors (JSON), publication year, venue, discipline tags, landing-page URL, PDF storage path (nullable), access/licence details, publication status, and timestamps.
- `research_paper_submissions`: submitter ID, submitted metadata, source URL, original filename, private storage path, file size, SHA-256 checksum, rights basis, licence identifier, evidence URL, attestation timestamp, review state, verification output, reviewer notes, and published record ID.
- `research_paper_review_audit`: submission ID, actor ID, action, reason, before/after state, and timestamp. Append records; do not let contributors update or delete them.
- Optional later: `research_paper_submission_events` for operational metrics and notifications.

Add indexes for submitter + created date, review state + created date, normalized DOI, OpenAlex ID, and checksum. Add a unique constraint for normalized DOI when non-null; handle DOI-less works with a separate deduplication path.

### Storage

- Create a **private** bucket named `research-paper-quarantine` for uploads that have not passed review.
- Create a separate **private** bucket for approved hosted PDFs, or use a private final bucket with signed delivery links. Do not make the quarantine bucket public.
- Scope upload paths by authenticated user and submission ID. Use strict file size limits, PDF MIME checks, magic-byte/signature checks, and a generated storage name rather than trusting the submitted filename.
- RLS must restrict contributors to their own submission rows and files. Only authorized reviewers can read the queue and quarantine objects. Never expose the Supabase service-role key to the browser.

### Edge Functions

1. `submit-research-paper`: authenticate the caller, validate all fields, check allowed rights-basis values, enforce per-user quotas, create a pending submission, and issue/accept an upload into private quarantine.
2. `verify-research-paper`: validate ownership or reviewer role; inspect the file; run the configured malware scanner; calculate SHA-256; extract PDF text/metadata; normalize DOI; query OpenAlex/Crossref for matching metadata; detect duplicates; store a structured report.
3. `review-research-paper`: admin-only actions for preview, request changes, reject, approve, and publish. Re-check all publication gates server-side at publish time. Do not rely on frontend role checks.
4. Optional `resolve-research-paper`: import/refresh metadata by DOI or OpenAlex ID without uploading a PDF.

All functions should validate request bodies, authenticate users where needed, set bounded timeouts, return consistent error shapes, and write audit events for privileged state changes.

## 5. Verification gates

A paper must not become publicly hosted until all gates pass:

1. **File integrity:** PDF signature, non-zero size, configured size limit, successful parsing, and SHA-256.
2. **Malware scan:** a real malware-scanning provider reports clean. If scanning is unconfigured, unavailable, or inconclusive, publishing a hosted PDF is blocked. A PDF header check or AI review is not malware scanning.
3. **Metadata:** title and author extraction; DOI validation; compare submitted metadata with PDF title page and Crossref/OpenAlex. AI may suggest fields but cannot silently overwrite contributor data.
4. **Duplicate detection:** normalized DOI exact match first, then checksum, OpenAlex ID, and title/author similarity. A match should link to the existing record or send to a reviewer, not create a duplicate.
5. **Rights:** verify the specific licence or written permission allows redistribution. AI is not a legal rights decision-maker.
6. **Human review:** reviewer explicitly approves metadata and rights evidence before publishing.

AI-generated reports are advisory and must be labeled as such. Treat all PDF text as untrusted input and never follow instructions embedded in a PDF.

## 6. Suggested status model

`draft → uploaded → scanning → extracting_metadata → needs_review → approved → published`

Alternative terminal or pause states:

- `changes_requested`
- `rejected`
- `duplicate`
- `scan_failed`
- `verification_failed`

Only the server-side review function can transition a submission to `approved` or `published`. Publishing must be a separate explicit action after approval.

## 7. Frontend pages and components

- Research Papers page: add **Submit a paper** CTA and submission policy summary.
- `/research-papers/submit`: accessible metadata form, DOI/link option, PDF upload option, licence/rights fields, consent checkbox, upload progress, and clear error recovery.
- `/research-papers/my-submissions`: status, submitted date, reviewer message, and resubmit action.
- `/admin/research-paper-reviews`: protected queue, filters, metadata comparison, safe private preview, rights evidence, review actions, and audit trail.
- Add an admin navigation entry only after route and authorization are implemented.
- Keep paper detail and PDF controls distinct: **Read at source** for external works and **View hosted PDF** only for files cleared for hosting.

## 8. Delivery phases

### Phase 1 — Foundations
- Confirm rights policy and moderation owner.
- Add schema, RLS, indexes, private buckets, retention rules, and storage policies.
- Add migration tests and RLS tests.

### Phase 2 — Contributor intake
- Build DOI/link submission first; this gives users a useful contribution path without hosting PDFs.
- Add PDF upload to quarantine with size/type validation and rights declaration.
- Build My Submissions page and status notifications.

### Phase 3 — Automated checks
- Integrate and test a real malware scanner.
- Add SHA-256, PDF parsing, DOI normalization, metadata enrichment, and duplicate checks.
- Store structured verification results and scanner evidence.

### Phase 4 — Human review and publication
- Build the admin review queue, private preview, approve/request-changes/reject actions, publish step, and audit history.
- Enforce rights + malware + reviewer gates again in the publishing Edge Function.
- Publish metadata-only records when hosting rights are not established.

### Phase 5 — Quality and launch
- Add unit, component, integration, RLS, and Edge Function tests.
- Test oversized, malformed, encrypted, corrupt, duplicate, non-OA, ambiguous-rights, scanner-timeout, and scanner-unavailable files.
- Verify mobile upload UX, keyboard accessibility, rate limits, quota handling, logs, retention, and rollback.
- Launch with manual review for every submission; consider automated triage only after real review data is available.

## 9. Acceptance criteria

- A contributor can submit a DOI/link without uploading a file.
- A contributor can upload only an allowed PDF into private quarantine and can see only their own submissions.
- No unreviewed or unscanned PDF is publicly reachable.
- A submission with missing or ambiguous rights evidence cannot be published as a hosted PDF.
- An unavailable/unconfigured malware scanner blocks hosted-PDF publication.
- Duplicate DOI/checksum submissions are detected and linked or routed for review.
- Admin-only actions are authorized server-side and audited.
- Rejected or change-requested submissions show a clear reason to the contributor.
- The public Research Papers page clearly distinguishes source-hosted papers from Sahadhyayi-hosted PDFs.

## 10. Out of scope for the first release

- Anonymous uploads.
- User-to-user file sharing.
- Bulk harvesting or mirroring publisher PDFs.
- Automatic publication based only on AI confidence.
- Claims that an OA flag, a valid PDF signature, or AI analysis establishes copyright clearance or malware safety.
