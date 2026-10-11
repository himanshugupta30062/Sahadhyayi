# Sahadhyayi — Book deduplication and catalog quality plan

**Status:** Planning only — no application code, database rows, or user bookshelf references have been changed.

**Repository reviewed:** `himanshugupta30062/Sahadhyayi`, default branch `main`.

## Executive recommendation

Build a **catalog-quality pipeline** that groups likely duplicate records, scores metadata and source quality, checks whether cover/reading links actually work, and presents a review queue before any record is hidden or changed.

Do not start by deleting books or by keeping only one record per title. The same title can legitimately have different authors, languages, translations, editions, abridgements, formats, or public-domain scans. Keep one preferred **catalog record for a work/edition where appropriate**, while preserving useful edition/source details and all user references.

Use **reversible soft-archiving** as the default cleanup strategy. Do not hard-delete automatically. A record should only be labeled “fake” when evidence supports that conclusion; missing cover/PDF alone means “incomplete” or “not currently readable,” not necessarily fake.

## 1. What the current repository shows

### Current external sources

The active Vite app's book-search path is centered on `src/components/library/BooksCollection.tsx`, `src/hooks/useBookSearch.ts`, and Supabase Edge Functions.

| Source | Where it appears in the code | Current use / limitation |
|---|---|---|
| **Open Library** | `supabase/functions/search-books/index.ts` and `search-books-preview/index.ts` | Searches Open Library's search API; maps title, first author, first ISBN, first publish year, median page count, language and cover ID. The preview function requests up to 50 results; the saving function requests up to 10. |
| **Google Books API** | Same two Edge Functions | Maps title, first author, categories, thumbnail, description, ISBN, year, page count, language and a possible preview/PDF-related URL. Important: `accessInfo.pdf.isAvailable` paired with `volumeInfo.previewLink` does not by itself prove the returned URL is a direct, downloadable PDF. Validate the URL and represent previews separately from downloads. |
| **Project Gutenberg via Gutendex** | Same two Edge Functions | Searches `gutendex.com/books`; filters out results without a PDF URL in the current mapping. It can offer legitimate public-domain downloads, but the record should retain Gutenberg's stable book ID and all available formats instead of assuming every result is a PDF. |
| **Internet Archive** | Same two Edge Functions | Searches Archive texts and maps identifier/title/creator/date/description. The current code constructs `https://archive.org/download/{identifier}/{identifier}.pdf`; that filename is not guaranteed to exist. Validate item metadata/files and access restrictions before calling it a usable PDF. |
| **Library Genesis (Libgen)** | `src/components/library/BooksCollection.tsx`, `src/utils/libgenApi.ts`, `src/components/library/LibgenBookCard.tsx`, plus legacy/server paths such as `server.js` and `archive/web-next/src/app/api/libgen/route.ts` | Searched separately by the Library UI through `/api/libgen`; it is **not one of the four providers merged by the two Supabase Edge Functions**. The UI combines Libgen results with other external search results. Do not treat its presence in search results as proof that those records were inserted into `books_library`. Because authorization and copyright status of individual files cannot be assumed, the quality plan should not automate downloading or promoting unauthorized copies; prefer official/open-access sources and label provenance clearly. |

The Library UI text currently says it searches “4 major sources”; that corresponds to the four providers in the Supabase aggregator. Libgen is an additional, separate search path.

### Relevant implementation files

- `src/components/library/BooksCollection.tsx` — starts search across the internal search flow, open-access results, and a separate Libgen request; combines results and filters external results against internal results using lowercased exact title and author strings.
- `src/hooks/useBookSearch.ts` — calls `search-books-preview`; gives search results temporary IDs for UI use; sends selected metadata to `save-selected-books`.
- `supabase/functions/search-books-preview/index.ts` — searches four providers and merges results in memory; it does not save those preview results to the database.
- `supabase/functions/search-books/index.ts` — searches the same four providers and has a save/update path for `books_library`; confirm its live callers before changing or removing it.
- `supabase/functions/save-selected-books/index.ts` — save-time duplicate checking; audit this function alongside `search-books/index.ts` so both write paths use the same rules.
- `src/hooks/useLibraryBooks.ts` — ranks records by completeness (cover, PDF, author and metadata); this improves ordering but **does not deduplicate records**.
- `src/hooks/useLibrary.ts` — another library hook with a direct insert path; audit every write path to avoid bypassing the deduplication service.
- `src/utils/searchExternalSources.ts` — adapts preview-function records for display and filters to entries with a `pdf_url`.
- `src/utils/libgenApi.ts` — calls the separate server endpoint for Libgen results.
- `src/components/library/BookSelectionModal.tsx` — user selects search results before saving through `save-selected-books`; external-result cards follow a separate UI path.

### Why duplicates can still happen

1. **Deduplication is mostly in-memory per search.** Merging API results in one response does not deduplicate against the entire existing catalog or across later searches.
2. **Matching is too strict at save time.** The current Edge Function's documented/query approach uses exact ISBN or exact title + author matching. Differences in punctuation, subtitles, author order/initials, whitespace, diacritics, ISBN formatting, and language can defeat exact equality.
3. **ISBN is incomplete.** Some providers have no ISBN, Open Library mapping selects only one ISBN, and older/public-domain works may have none.
4. **Language/edition identity is not modeled in the merge key.** The preview merger uses ISBN when present, otherwise normalized title + author, but language and edition are not part of that fallback key. This can merge distinct variants or fail to match records when metadata differs.
5. **The external-vs-catalog UI comparison is weaker than a canonical matcher.** It compares lowercased title and author strings but does not normalize punctuation, subtitles, author variants, language, or ISBN.
6. **A completeness score is not a quality verdict.** A cover or PDF URL can be broken, point to a preview, or not correspond to the listed title. Conversely, a valid book can lack a cover or downloadable PDF.
7. **Source URLs are not always validated.** In particular, a constructed Internet Archive PDF path may not exist, and a Google Books preview URL may not be a downloadable PDF.
8. **Multiple writers can bypass one another.** The search Edge Function, selected-book save function, and direct library insertion hook must be audited and routed through one shared policy.

## 2. Product behavior we want

### Reader-facing catalog

- Show one best default result for a work when records are confidently the same.
- Preserve editions/translations as selectable variants when they materially differ.
- Prefer accurate title/author/language, reliable cover, verified reading access, and trusted metadata—not just the newest row or a PDF-shaped URL.
- Label availability accurately: **Read online**, **Download available**, **Preview only**, **Metadata only**, or **Access unavailable**.
- Keep a record with no cover/PDF if it is a valid bibliographic record and useful for discovery; optionally demote it or hide it from “read now” filters. Do not automatically call it fake.
- Never display fabricated community ratings, availability, or download status.

### Admin/catalog-review workflow

Create a review-only report or admin screen with:
- candidate duplicate group;
- proposed canonical record and why it wins;
- alternative records and source provenance;
- match confidence and evidence;
- quality flags such as missing/failed cover, inaccessible link, preview-only URL, missing author, suspicious metadata, or likely wrong-language match;
- dependent user records that would be affected (shelves, progress, notes, reviews, rooms, threads, references);
- actions: **Keep separate**, **Choose canonical**, **Merge after preview**, **Soft-archive**, and **Mark link unavailable**;
- audit trail with reviewer, timestamp, reason, and undo path.

Start with a generated CSV/JSON report or read-only admin view. Do not mass-change production records in the first iteration.

## 3. Matching model: work, edition, and file are different things

Use a staged matcher, not a single title equality check.

### Stage A — Normalize metadata

Create deterministic normalized fields for matching:
- Unicode normalization, trim/collapse whitespace, case-folding, punctuation normalization, and normalized apostrophes/dashes;
- preserve the original display title and subtitle;
- normalize author names conservatively (aliases/initials may help, but never assume different names are identical without evidence);
- normalize ISBN-10/ISBN-13 by removing separators and validate check digits; convert ISBN-10 to ISBN-13 where appropriate;
- normalize language to a standard language code when known;
- parse publication year and page count safely;
- retain provider name and stable provider identifier/URL;
- retain edition, translator, publisher, format, and original-language data where supplied.

Do not strip all non-ASCII characters blindly: that can damage Hindi and other non-English titles and create false matches.

### Stage B — Generate candidate pairs

Use evidence in this order:
1. Same validated ISBN-13/ISBN-10 (strong edition-level evidence).
2. Same stable provider ID (same source record).
3. Strong normalized title + compatible author + compatible language.
4. Fuzzy title similarity + author/translator/language/year evidence.
5. Manual review for ambiguous cases.

A shared title alone is never sufficient. If author or language conflicts, keep records separate or route to manual review. Treat translations, abridgements, illustrated editions, revised editions, and different volumes as distinct when relevant.

### Stage C — Assign confidence and explain it

Initial proposed bands (calibrate on a manually reviewed sample):
- **0.97–1.00: Very high confidence** — exact validated ISBN or stable source ID, with no contradictory metadata.
- **0.85–0.96: High confidence** — strong title + author match and compatible language/edition evidence.
- **0.65–0.84: Review** — plausible duplicate but missing/conflicting metadata.
- **Below 0.65: Keep separate by default** — insufficient evidence.

These are starting thresholds, not measured accuracy. Do not automatically merge or archive based only on a fuzzy score until a human-reviewed sample confirms precision.

## 4. Quality scoring: choose the best record without confusing quality and identity

Calculate a separate **record quality score** after grouping candidate duplicates. Suggested 100-point model:

| Dimension | Points | Evidence |
|---|---:|---|
| Bibliographic identity | 0–25 | Valid ISBN/provider ID, consistent title and author, compatible language/edition |
| Source/provenance | 0–20 | Recognized catalog source and traceable source URL/ID |
| Readability/access | 0–20 | Confirmed accessible legal full text; lower score for preview-only; zero for broken/unverified link |
| Cover quality | 0–10 | Image URL responds, usable image, adequate dimensions, correct book match |
| Metadata completeness | 0–10 | Author, description, publication year, page count, language, publisher/edition when known |
| Consistency | 0–10 | Fields agree across sources and no obvious title/author/language contradiction |
| User/library value | 0–5 | Existing shelf/progress/review references; this protects records with user history during cleanup |

Rules:
- Missing cover or PDF should lower a dimension, not automatically invalidate the book.
- A valid metadata-only record can still be the canonical bibliographic record, while a separate linked edition supplies the readable file.
- A high score does not establish copyright permission. Provenance and legal access checks remain separate gates.
- Do not give an arbitrary “newest record” a win over a more accurate or usable record.
- Track reason codes alongside scores so reviewers can understand why a record ranked higher.

## 5. Link and content validation

Run link validation in a controlled background job with timeouts, rate limits, caching, and provider terms respected.

For each cover or reading URL:
- validate allowed protocol and host; reject unsafe schemes and local/private-network targets;
- use provider APIs/metadata when available instead of guessing file paths;
- check response status and content type, allowing for redirects and servers that do not support HEAD;
- distinguish PDF file, EPUB, HTML reader, Google Books preview, restricted borrow, and unknown type;
- do not download entire books merely to test availability;
- store `last_checked_at`, `availability_status`, `availability_reason`, and source metadata in a deliberate schema change after review;
- use cached results and re-check only stale/failed links to avoid hammering external providers;
- mark temporarily unavailable links as unverified rather than permanently broken after one timeout.

A “fake/wrong record” flag should require evidence such as a title/author mismatch, malformed or contradictory bibliographic data, a dead/spam URL, or duplicate source identifier—not merely absent media.

## 6. Safe data model and cleanup

First inspect the real Supabase schema, foreign keys, RLS policies, and all references to `books_library.id`. Then propose the smallest migration. Candidate fields may include:
- `normalized_title`, `normalized_author`, `language_code`;
- `source_provider`, `source_record_id`, `source_url`;
- `edition_key` or edition/translator/publisher metadata;
- `catalog_status` (active, needs_review, duplicate, archived, unavailable);
- `canonical_book_id` for a superseded record;
- `quality_score`, `quality_flags`, `last_checked_at`.

These are proposals only. Do not add all fields without verifying the existing schema and whether equivalent columns already exist.

Cleanup sequence:
1. Export/backup the current catalog and capture row counts.
2. Generate duplicate candidate groups without mutating rows.
3. Review a representative sample, including same-title different-author and translated editions.
4. Produce a dry-run report of proposed canonical IDs and all dependent foreign-key references.
5. Add reversible status/canonical mapping only after the schema and RLS review.
6. Hide superseded records from normal catalog queries while retaining their rows and IDs.
7. Where safe and explicitly approved, redirect old book-detail links to the canonical record and map user-facing actions to the canonical work/edition.
8. Reconcile shelves, reading progress, notes, ratings, reviews, groups, and any other references only under explicit, tested migration rules.
9. Run integrity checks and compare counts before/after.
10. Keep a rollback path and audit log. Permanent deletion is a separate, manual, later decision—not part of automatic cleanup.

**Default policy:** soft-archive superseded duplicates. Never auto-delete records or rewrite user references based on fuzzy title matching alone.

## 7. Implementation phases

### Phase 0 — Audit and baseline (no production writes)
- Inspect `save-selected-books`, all callers of `search-books`, direct book inserts, table schema, foreign keys, RLS, and catalog query hooks.
- Confirm which Edge Function is used in production and whether the archived Next.js/Libgen paths are deployed or dead code.
- Export a sample catalog and measure exact-title, normalized-title, ISBN, missing-cover, missing-link, and invalid-link rates.
- Write unit tests for normalization and candidate matching before implementing cleanup.

**Exit criteria:** every book-write path is documented; no production records changed.

### Phase 1 — One matching library
- Implement shared, deterministic normalization and duplicate-candidate logic in a reusable server-side module.
- Reuse the same logic in preview grouping and save-time duplicate checks.
- Keep different languages/editions separate unless evidence is strong.
- Add database uniqueness protection for safe identifiers only after existing duplicates are reconciled and the schema is verified.
- Add tests for punctuation, subtitles, author variants, missing ISBN, ISBN-10/13, Hindi/non-Latin titles, different languages, same title/different authors, and different editions.

**Exit criteria:** repeat searches do not create new rows for the same verified edition; legitimate variants remain separate.

### Phase 2 — Dry-run quality report
- Generate duplicate clusters, quality flags, source provenance, candidate canonical record, score, and confidence.
- Include foreign-key/user-history impact and reason codes.
- Let an admin export and review the report; no automated archive/delete actions yet.

**Exit criteria:** manually reviewed samples meet an agreed precision target; ambiguous pairs are clearly marked for review.

### Phase 3 — Review UI and reversible soft-archive
- Add an admin-only review queue using existing admin authorization patterns.
- Support keep separate, choose canonical, mark unavailable, and soft-archive with reason and audit trail.
- Ensure standard Library/Discovery queries exclude superseded rows while direct references and historical user data remain resolvable.

**Exit criteria:** rollback works and user references remain intact in staging tests.

### Phase 4 — URL validation and ongoing prevention
- Add provider-aware link checks and stale-link refresh.
- Route every catalog write through the shared deduplication service.
- Add duplicate/quality telemetry and a scheduled report.
- Re-run matching on new imports and periodically on older rows, but require review for uncertain cases.

**Exit criteria:** quality regressions are visible; repeat imports are idempotent; broken links are not presented as working downloads.

## 8. Acceptance tests

- Same ISBN from two providers becomes one edition record with merged non-conflicting metadata.
- Same title but different authors remains separate.
- Same work in Hindi and English remains separate unless deliberately represented as linked translations.
- Different editions/volumes/translations are not silently merged.
- A book with no cover and no full-text file is flagged incomplete, not automatically marked fake.
- A Google Books preview is never labeled as a downloadable PDF unless a real PDF URL is confirmed.
- A constructed but nonexistent Internet Archive PDF URL is marked unavailable.
- Search repeated three times does not create three catalog records.
- Existing shelf, progress, notes, reviews, rooms, and group references survive soft-archive/canonical mapping.
- Guest/member/admin permissions are tested; only authorized admins can review/archive catalog records.
- Every cleanup batch has a dry-run output, before/after counts, audit log, and rollback plan.

## 9. Decisions and safe defaults

No decision is needed to begin Phase 0. For the first implementation, use these defaults:
1. **Duplicates:** soft-archive only after confidence and reference-impact review; do not hard-delete.
2. **No cover and no full-text:** mark incomplete/metadata-only; keep discoverable if metadata is credible, but do not promote as “read now.”
3. **Ambiguous same-title records:** keep separate pending review.
4. **Source policy:** prioritize traceable, legal, open-access/full-text sources and official previews; do not automate retrieval or promotion of unauthorized copies.
5. **Canonical selection:** score identity, trustworthy metadata, validated access, and user-history impact separately; do not choose by cover alone.

## 10. First coding-agent task

Ask the coding agent to complete **Phase 0 only**:
- inspect `supabase/functions/save-selected-books/index.ts` and all catalog write paths;
- map the schema and foreign-key dependencies of `books_library`;
- identify the production callers for both search Edge Functions;
- produce a dry-run report design and tests for the matching rules;
- make no database changes, no deletes, and no production behavior changes;
- report exact files inspected, confirmed findings, unknowns, and proposed next migration.

Do not implement bulk cleanup until Phase 0 is reviewed.
