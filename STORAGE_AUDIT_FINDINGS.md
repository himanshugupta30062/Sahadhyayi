# Storage Buckets & Security Audit — PDF System

**Audit Date:** 2026-11-15  
**Scope:** Supabase storage buckets, RLS policies, signed URLs, malware scanning, deduplication, quarantine flow, unauthorized access prevention, orphan cleanup

---

## 1. Storage Bucket Inventory (PDF-Related)

| Bucket ID | Public | Size Limit | Allowed MIME Types | Purpose |
|-----------|--------|------------|-------------------|---------|
| `book-pdf-quarantine` | ❌ false | 50 MiB (52,428,800) | `application/pdf` only | Private intake for user-submitted PDFs awaiting admin review |
| `book-pdfs` | ✅ true | 50 MiB | `application/pdf` only | Public catalog PDFs (approved/published) |
| `research-paper-quarantine` | ❌ false | 50 MiB | `application/pdf` only | Private intake for research paper submissions |
| `books` | ✅ true | (existing) | Mixed (covers, etc.) | Legacy bucket for book covers and public assets |
| `news-covers` | ✅ true | 5 MiB | `image/jpeg`, `image/png`, `image/webp` | Newsroom cover images |
| `audio-summaries` | ✅ true | 50 MiB | `audio/mpeg`, `audio/mp3` | Audio book summaries |
| `book-reels` | ✅ true | 50 MiB | `video/mp4`, `video/webm`, `video/quicktime` | User video uploads |
| `social-post-media` | ❌ false | 5 MiB | `image/jpeg`, `image/png`, `image/webp`, `image/avif` | Social post images (private, audience-controlled) |

**File References:**
- `supabase/migrations/20261027120000_add_book_pdf_submission_quarantine.sql:87-106` — `book-pdf-quarantine` creation + validation
- `supabase/migrations/20261027120000_admin_book_pdf_manager.sql:4-9` — `book-pdfs` creation (public)
- `supabase/migrations/20261102190000_research_paper_submissions.sql:30` — `research-paper-quarantine`
- `supabase/migrations/20261102180000_newsroom_cover_storage.sql:2-7` — `news-covers`
- `supabase/migrations/20261020010000_repair_book_details_backend_paths.sql:69-74` — `audio-summaries`
- `supabase/migrations/20261113090000_user_book_reels.sql:26-29` — `book-reels`
- `supabase/migrations/20261023170000_secure_social_post_media.sql:3-16` — `social-post-media`

---

## 2. Storage Policies (RLS) — Per Bucket

### 2.1 `book-pdf-quarantine` (Private — User Submissions)

| Policy | Operation | Target | Condition |
|--------|-----------|--------|-----------|
| `Users can upload own quarantined book PDFs` | INSERT | authenticated | `bucket_id = 'book-pdf-quarantine` AND `foldername(name)[1] = auth.uid()` AND `array_length(foldername(name), 1) = 2` AND `filename(name) = 'source.pdf'` |
| `Users can view own quarantined book PDFs` | SELECT | authenticated | `bucket_id = 'book-pdf-quarantine' AND foldername(name)[1] = auth.uid()` |

**Missing/Incomplete:**
- ❌ **No DELETE policy** for users to remove their own quarantine files (unlike `research-paper-quarantine` which has one)
- ❌ **No admin SELECT policy** explicitly defined (though service role bypasses RLS)
- ✅ Path constraint enforced at DB level: `storage_path = user_id::text || '/' || id::text || '/source.pdf'` (migration `20261027120000_add_book_pdf_submission_quarantine.sql:35`)

**File References:**
- `supabase/migrations/20261027120000_add_book_pdf_submission_quarantine.sql:107-126`

### 2.2 `book-pdfs` (Public — Published Catalog)

| Policy | Operation | Target | Condition |
|--------|-----------|--------|-----------|
| `Public can read catalog PDFs` | SELECT | anon, authenticated | `bucket_id = 'book-pdfs'` |
| `Admins can upload catalog PDFs` | INSERT | authenticated | `bucket_id = 'book-pdfs' AND public.is_admin()` |
| `Admins can update catalog PDFs` | UPDATE | authenticated | `bucket_id = 'book-pdfs' AND public.is_admin()` |

**Missing/Incomplete:**
- ❌ **No DELETE policy** for admins (though `delete_pdf_safely` RPC uses `storage.remove()` directly with service role)
- ❌ **No signed URL generation policy** — public bucket allows direct public URLs; no time-limited access control

**File References:**
- `supabase/migrations/20261027120000_admin_book_pdf_manager.sql:11-28`

### 2.3 `research-paper-quarantine` (Private — Research Papers)

| Policy | Operation | Target | Condition |
|--------|-----------|--------|-----------|
| `Users upload own research quarantine files` | INSERT | authenticated | `bucket_id = 'research-paper-quarantine' AND foldername(name)[1] = auth.uid()` |
| `Submitters and admins read research quarantine files` | SELECT | authenticated | `bucket_id = 'research-paper-quarantine' AND (foldername(name)[1] = auth.uid() OR public.is_admin())` |
| `Users delete own research quarantine files` | DELETE | authenticated | `bucket_id = 'research-paper-quarantine' AND foldername(name)[1] = auth.uid()` |

**Note:** More complete than `book-pdf-quarantine` (includes DELETE + admin read).

**File References:**
- `supabase/migrations/20261102190000_research_paper_submissions.sql:31-33`

---

## 3. Signed URL Generation & Download Permissions

### Current Implementation

| Component | Method | Expiry | Access Control |
|-----------|--------|--------|----------------|
| Admin preview (quarantine) | `storage.from('book-pdf-quarantine').createSignedUrl(path, 180)` | 3 min | Admin-only via `review-book-pdf` Edge Function (`action: "preview"`) |
| Public catalog PDFs | `storage.from('book-pdfs').getPublicUrl(path)` | None (permanent) | Public read — no auth required |
| PDF Proxy (external) | Edge Function `pdf-proxy` streams via allow-listed hosts | N/A | Rate-limited (30 req/5 min per user/IP), SSRF-protected |

**File References:**
- `supabase/functions/review-book-pdf/index.ts:246-249` — Admin preview signed URL (180s)
- `supabase/functions/review-book-pdf/index.ts:404-410` — Public URL generation for published PDFs
- `supabase/functions/pdf-proxy/index.ts:182-438` — External PDF proxy with strict validation

### Gaps
- ❌ **No signed URLs for public `book-pdfs` bucket** — Anyone with the URL can access indefinitely
- ❌ **No download tracking/audit** for public PDF access
- ❌ **No expiry/rotation** for public PDF URLs
- ✅ **Quarantine previews are properly time-limited** (3 min) and admin-only

---

## 4. File Movement Between Buckets

### Quarantine → Public (`book-pdf-quarantine` → `book-pdfs`)

**Flow:** Admin approves + publishes via `review-book-pdf` Edge Function (`action: "publish"`)

```typescript
// 1. Download from quarantine
const { data: source } = await admin.storage.from('book-pdf-quarantine').download(submission.storage_path);

// 2. Verify PDF signature (magic bytes)
const signature = new Uint8Array(await source.slice(0, 5).arrayBuffer());
if (new TextDecoder().decode(signature) !== "%PDF-") throw Error;

// 3. Malware scan (Bouncer API)
const scanResult = await runMalwareScan(source, scannerToken, apiBase);

// 4. Upload to public bucket
const publicPath = `${targetBookId}/${submissionId}.pdf`;
await admin.storage.from('book-pdfs').upload(publicPath, source, { contentType: 'application/pdf', upsert: false });

// 5. Get public URL
const pdfUrl = admin.storage.from('book-pdfs').getPublicUrl(publicPath).data.publicUrl;

// 6. Update books_library with PDF metadata
await admin.from('books_library').update({ pdf_url, pdf_sha256, pdf_file_size, pdf_page_count, pdf_verification_status: 'verified' }).eq('id', targetBookId);

// 7. Transactional rollback on failure
```

**File References:**
- `supabase/functions/review-book-pdf/index.ts:353-425`

### Replacement Flow (Public → Public)

**Flow:** `replace_pdf` RPC + `review-book-pdf` Edge Function (`action: "replace_pdf"`)

1. New PDF uploaded to quarantine (separate submission)
2. Malware scan on new PDF
3. Upload new PDF to `book-pdfs` at `${bookId}/${newSubmissionId}.pdf`
4. Call `replace_pdf` RPC (atomic: updates `books_library`, creates audit, deletes old storage object)
5. Rollback on any failure

**File References:**
- `supabase/migrations/20261115000001_enhance_books_library_for_pdf_workflow.sql:381-466` — `replace_pdf` RPC
- `supabase/functions/review-book-pdf/index.ts:496-599` — Replace action

### Cleanup on Rejection

**Trigger:** `cleanup_quarantine_on_rejection()` on `book_pdf_submissions` status change to `rejected`

```sql
PERFORM storage.remove('book-pdf-quarantine', ARRAY[NEW.storage_path]);
```

**File References:**
- `supabase/migrations/20261115000001_enhance_books_library_for_pdf_workflow.sql:540-555`

---

## 5. Malware Scanning Integration

### Implementation: Bouncer API (`api.usebouncer.dev`)

| Aspect | Details |
|--------|---------|
| **Integration Point** | `review-book-pdf` Edge Function (`runMalwareScan` function) |
| **Trigger** | Only on `publish` and `replace_pdf` actions (admin-initiated) |
| **Not Scanned** | During `verify-book-pdf` (user-initiated verification) — explicitly noted in findings |
| **File Size Handling** | ≤4.5 MB: v1 direct upload; >4.5 MB: v2 presigned upload |
| **Timeout** | 60s total (15s create + 20s upload + polling) |
| **Verdicts** | `clean` → allow; `suspicious`/`malicious`/`failed`/`timeout` → block publish |
| **Bypass** | If `BOUNCER_API_KEY` not set → logs warning, sets `malware_scan_details = { bypassed: true }`, allows publish |

### Database Tracking

| Column | Table | Values |
|--------|-------|--------|
| `malware_scan_status` | `book_pdf_submissions` | `pending`, `scanning`, `clean`, `suspicious`, `malicious`, `failed`, `timeout` |
| `malware_scan_completed_at` | `book_pdf_submissions` | timestamp |
| `malware_scan_details` | `book_pdf_submissions` | JSONB (engine, threats, etc.) |
| `pdf_verification_status` | `books_library` | `malware_detected` (among others) |

**File References:**
- `supabase/functions/review-book-pdf/index.ts:79-179` — `runMalwareScan` implementation
- `supabase/functions/review-book-pdf/index.ts:361-401` — Publish-time scan
- `supabase/migrations/20261115000001_enhance_books_library_for_pdf_workflow.sql:47-51` — Schema columns

### Gaps
- ❌ **No malware scan on initial upload/verification** — Only at publish time
- ❌ **No scheduled re-scan** of existing public PDFs
- ❌ **Bypass allowed** if `BOUNCER_API_KEY` missing (dev convenience, prod risk)
- ✅ **Fail-closed** on scan errors/timeout

---

## 6. PDF Signature Validation

### Magic Bytes Check (Multiple Layers)

| Layer | Location | Check |
|-------|----------|-------|
| Client upload constraint | `book_pdf_submissions` table | MIME type `application/pdf` enforced by bucket `allowed_mime_types` |
| Edge Function `verify-book-pdf` | `validatePDFStructure()` | `%PDF-` header + trailer (`startxref` + `%%EOF`) + page count extraction |
| Edge Function `verify-book-pdf` | Line 205-206 | Quick magic bytes: `header !== "%PDF-"` |
| Edge Function `review-book-pdf` (publish) | Line 358-359 | `signature !== "%PDF-"` before malware scan |
| Edge Function `review-book-pdf` (replace) | Line 523-524 | Same check on replacement PDF |

### Structure Validation (`validatePDFStructure`)

```typescript
// Checks:
// 1. Header starts with "%PDF-"
// 2. Trailer (last 2KB) contains "startxref" AND "%%EOF"
// 3. Extracts page count from "/Count" in trailer or header
```

**File References:**
- `supabase/functions/verify-book-pdf/index.ts:28-65` — `validatePDFStructure`
- `supabase/functions/verify-book-pdf/index.ts:197-206` — Verification-time checks
- `supabase/functions/review-book-pdf/index.ts:358-359, 523-524` — Publish/replace checks

---

## 7. SHA-256 Deduplication

### Implementation

| Level | Mechanism | Scope |
|-------|-----------|-------|
| **Submission DB** | `pdf_sha256` column + unique partial index `ux_book_pdf_submissions_pdf_sha256` | Prevents duplicate uploads across all non-rejected/failed submissions |
| **Catalog DB** | `pdf_sha256` column + unique partial index `ux_books_library_pdf_sha256` | Prevents same PDF content on multiple books (unless explicitly linked) |
| **Trigger** | `prevent_duplicate_submission_sha256()` BEFORE INSERT/UPDATE | Blocks duplicate SHA-256 at write time |
| **Verification-time** | `checkDuplicateBySHA256()` in `verify-book-pdf` | Catches duplicates before Gemini analysis |

### Flow

1. User uploads PDF to quarantine
2. `verify-book-pdf` computes SHA-256 via `crypto.subtle.digest("SHA-256")`
3. Checks `book_pdf_submissions` for existing non-rejected submission with same hash
4. If found → rejects with error: "This PDF content has already been submitted"
5. On publish → SHA-256 stored in `books_library.pdf_sha256` for catalog-level deduplication

**File References:**
- `supabase/migrations/20261115000001_enhance_books_library_for_pdf_workflow.sql:25-29, 60-63` — Unique indexes
- `supabase/migrations/20261115000001_enhance_books_library_for_pdf_workflow.sql:558-578` — Trigger function
- `supabase/functions/verify-book-pdf/index.ts:70-90` — `checkDuplicateBySHA256`
- `supabase/functions/verify-book-pdf/index.ts:188-195` — Verification-time duplicate check

---

## 8. Unauthorized Access Prevention

### Quarantine Bucket (`book-pdf-quarantine`)

| Protection | Implementation |
|------------|----------------|
| **User isolation** | Path prefix = `auth.uid()` enforced by RLS INSERT/SELECT policies |
| **Path format** | DB constraint: `user_id/submission_id/source.pdf` (2 folder levels + fixed filename) |
| **No public access** | Bucket `public = false`; no anon policies |
| **No cross-user read** | SELECT policy requires `foldername(name)[1] = auth.uid()` |
| **Admin bypass** | Service role (Edge Functions) bypasses RLS; admin SELECT policy missing but service role used |

### Public Bucket (`book-pdfs`)

| Protection | Implementation |
|------------|----------------|
| **Write restriction** | Only admins (`public.is_admin()`) can INSERT/UPDATE |
| **Read** | Public (intentional for catalog) |
| **Delete** | Only via `delete_pdf_safely` RPC (admin + service role) |

### PDF Proxy (External PDFs)

| Protection | Implementation |
|------------|----------------|
| **SSRF Prevention** | `isPrivateOrLoopbackHost()` blocks private IPs, localhost, metadata endpoints, link-local |
| **Host Allow-list** | Only 31 explicitly allowed domains (Gutenberg, Archive.org, etc.) |
| **HTTPS Only** | Rejects HTTP, credentials, fragments, non-standard ports |
| **Redirect Validation** | Each redirect hop re-validated against allow-list + SSRF checks |
| **Size Limit** | 50 MB response cap (header + streaming) |
| **Rate Limiting** | 30 req/5 min per user/IP |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `CSP: sandbox` |

**File References:**
- `supabase/functions/pdf-proxy/index.ts:64-115` — SSRF + allow-list validation
- `supabase/functions/pdf-proxy/index.ts:120-159` — URL validation
- `supabase/functions/pdf-proxy/index.ts:200-212` — Rate limiting

---

## 9. Orphan Cleanup & Quarantine Flow

### Quarantine Cleanup Triggers

| Trigger | Condition | Action |
|---------|-----------|--------|
| `cleanup_quarantine_on_rejection` | `status` changes to `rejected` | `storage.remove('book-pdf-quarantine', [storage_path])` |
| Manual admin delete | Via `review-book-pdf` (not implemented as action) | Not automated |
| Expired submissions | No TTL/cleanup job for `uploaded`/`queued`/`failed` stuck submissions | ❌ **Missing** |

### Published PDF Cleanup

| Scenario | Handling |
|----------|----------|
| `delete_pdf_safely` RPC | Removes from `book-pdfs` storage + clears `books_library` PDF fields + audit log |
| `replace_pdf` RPC | Removes old storage object after successful new upload + audit |
| Publish rollback | On `books_library` update failure → removes newly uploaded public object |

**File References:**
- `supabase/migrations/20261115000001_enhance_books_library_for_pdf_workflow.sql:540-555` — Rejection cleanup trigger
- `supabase/migrations/20261115000001_enhance_books_library_for_pdf_workflow.sql:276-376` — `delete_pdf_safely` RPC
- `supabase/migrations/20261115000001_enhance_books_library_for_pdf_workflow.sql:381-466` — `replace_pdf` RPC
- `supabase/functions/review-book-pdf/index.ts:422-424` — Publish rollback

### Gaps
- ❌ **No scheduled orphan cleanup** for:
  - Quarantine files with no corresponding `book_pdf_submissions` row
  - Submissions stuck in `uploaded`/`queued`/`scanning`/`extracting`/`matching` > 24h
  - Public `book-pdfs` objects not referenced by any `books_library.pdf_url`
- ❌ **No DELETE policy** on `book-pdf-quarantine` for users to self-clean

---

## 10. Audit Trail & Compliance

### Audit Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `book_pdf_admin_audit` | Admin upload/delete/replace of catalog PDFs | Admin SELECT/INSERT only |
| `book_pdf_review_audit` | Review workflow actions (verify, approve, reject, publish) | Admin SELECT only |

### Audit Coverage

| Event | Logged In | Details Captured |
|-------|-----------|------------------|
| Admin PDF upload | `book_pdf_admin_audit` | book_id, previous_pdf_url, new_pdf_url, source_url, rights_basis, rights_notes, file_name, file_size, uploaded_by |
| Admin PDF delete | `book_pdf_admin_audit` + `book_pdf_review_audit` | previous_pdf_url, reason, deleted_book_id |
| Admin PDF replace | `book_pdf_admin_audit` + `book_pdf_review_audit` | previous_pdf_url, new_pdf_url, replacement: true |
| Submission verification | `book_pdf_review_audit` | model, recommendation, confidence, match_confidence, catalogue_match_status, sha256, page_count |
| Submission approve/reject | `book_pdf_review_audit` | action, reason |
| Submission publish | `book_pdf_review_audit` | target_book_id, rights_basis, evidence_host, scan_bypassed, malware_details |

**File References:**
- `supabase/migrations/20261027120000_admin_book_pdf_manager.sql:30-58` — `book_pdf_admin_audit`
- `supabase/migrations/20261029230000_add_book_pdf_review_workflow.sql:15-37` — `book_pdf_review_audit`
- `supabase/functions/review-book-pdf/index.ts:269-274, 452-464, 585-597` — Audit inserts

---

## 11. Summary of Findings

### Critical / High Severity

| # | Finding | File/Location | Risk |
|---|---------|---------------|------|
| 1 | **No scheduled orphan cleanup** for quarantine or public buckets | N/A (missing) | Storage bloat, orphaned sensitive files |
| 2 | **Malware scan bypass** if `BOUNCER_API_KEY` missing | `review-book-pdf/index.ts:366-369` | Malicious PDFs could be published in misconfigured environments |
| 3 | **No malware scan at upload/verification time** — only at publish | `verify-book-pdf/index.ts` vs `review-book-pdf/index.ts` | Infected files sit in quarantine; admin may not know until publish attempt |
| 4 | **Public `book-pdfs` URLs are permanent** — no signed URLs, no expiry, no access logging | `review-book-pdf/index.ts:410` | No revocation capability; anyone with URL has permanent access |
| 5 | **Missing DELETE policy** on `book-pdf-quarantine` for users | `20261027120000_add_book_pdf_submission_quarantine.sql` | Users cannot remove their own failed/abandoned uploads |

### Medium Severity

| # | Finding | File/Location | Risk |
|---|---------|---------------|------|
| 6 | **No admin SELECT policy** on `book-pdf-quarantine` (relies on service role) | `20261027120000_add_book_pdf_submission_quarantine.sql` | If service role not used, admins cannot preview |
| 7 | **No TTL/auto-expiry** for stuck submissions in quarantine | N/A (missing) | Quarantine fills with abandoned uploads |
| 8 | **`replace_pdf` RPC deletes old storage object** but only as `PERFORM` (best effort, no error handling) | `20261115000001_enhance_books_library_for_pdf_workflow.sql:459-462` | Old PDFs may leak if storage.remove fails |
| 9 | **`delete_pdf_safely` RPC uses `storage.remove`** (best effort, no verification) | `20261115000001_enhance_books_library_for_pdf_workflow.sql:318` | Deletion may silently fail |
| 10 | **PDF signature validation only checks magic bytes** — no full PDF parsing/validation | `verify-book-pdf/index.ts:28-65` | Malformed/malicious PDFs with valid header could pass |

### Low Severity / Improvements

| # | Finding | File/Location | Recommendation |
|---|---------|---------------|----------------|
| 11 | **Quarantine path constraint** hardcoded to `source.pdf` — no flexibility | `20261027120000_add_book_pdf_submission_quarantine.sql:35` | Consider allowing multiple files per submission |
| 12 | **No download audit** for public PDFs | N/A | Add access logging for compliance |
| 13 | **Rate limiting** on `pdf-proxy` is per-user/IP but not per-submission | `pdf-proxy/index.ts:202` | Consider submission-aware limits |
| 14 | **`validatePDFStructure` page count extraction** fragile (regex on trailer) | `verify-book-pdf/index.ts:48-59` | Use proper PDF parser for page count |
| 15 | **Bouncer v1/v2 logic** duplicated in `runMalwareScan` | `review-book-pdf/index.ts:86-138` | Refactor into cleaner abstraction |

---

## 12. Recommended Actions

### Immediate (Pre-Production)
1. **Add scheduled orphan cleanup job** (pg_cron or GitHub Actions) for:
   - Quarantine files > 7 days with no submission row
   - Submissions stuck in non-terminal status > 24h
   - Public PDFs not referenced by `books_library`
2. **Enforce `BOUNCER_API_KEY` in production** — fail deploy if missing
3. **Add DELETE policy** on `book-pdf-quarantine` for users
4. **Add admin SELECT policy** on `book-pdf-quarantine` for explicit admin preview

### Short-Term
5. **Implement signed URLs** for `book-pdfs` with configurable TTL (e.g., 1 hour)
6. **Add malware scan at verification time** (async, non-blocking) with status tracking
7. **Add download audit logging** for public PDF access
8. **Strengthen `storage.remove` error handling** in RPCs (verify deletion, retry, alert)

### Long-Term
9. **Full PDF parsing/validation** (e.g., pdf-lib, PDF.js server-side) beyond magic bytes
10. **Periodic re-scan** of public PDFs with updated malware signatures
11. **PDF watermarking/DRM** options for sensitive content
12. **Automated rights verification** workflow integration

---

## Appendix: Key File Paths

| Area | Files |
|------|-------|
| Quarantine bucket + policies | `supabase/migrations/20261027120000_add_book_pdf_submission_quarantine.sql` |
| Public catalog bucket + policies | `supabase/migrations/20261027120000_admin_book_pdf_manager.sql` |
| Enhanced workflow schema + RPCs | `supabase/migrations/20261115000001_enhance_books_library_for_pdf_workflow.sql` |
| Workflow enhancements + indexes | `supabase/migrations/20261115000002_complete_pdf_workflow_enhancements.sql` |
| User verification (Gemini) | `supabase/functions/verify-book-pdf/index.ts` |
| Admin review + publish + malware | `supabase/functions/review-book-pdf/index.ts` |
| External PDF proxy (SSRF-safe) | `supabase/functions/pdf-proxy/index.ts` |
| Security test assertions | `supabase/tests/book_pdf_submission_security.test.sql` |
| Documentation | `docs/book-pdf-review-workflow.md`, `docs/book-pdf-verification-rollout.md` |