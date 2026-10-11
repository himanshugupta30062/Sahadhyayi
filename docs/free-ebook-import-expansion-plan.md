# Sahadhyayi — Unified Free and Open-Access Book Import Plan

**Status:** Implementation plan only. This document does not change application code, database schema, imported books, or user records.

**Repository:** `himanshugupta30062/Sahadhyayi`

## 1. Goal and product principle

Build one provider-independent import pipeline that discovers books from the current sources and new open-access sources, normalizes metadata, identifies duplicate works and editions, verifies reading access and rights, ranks record quality, and saves only after the user or an authorized import workflow chooses an eligible result.

The Library should not equate “API result exists” with “free ebook available.” Each result must distinguish:

- **Metadata only** — bibliographic record, no verified reading route.
- **Read online** — verified official reader or HTML text.
- **Download available** — a verified downloadable file/format.
- **Preview only** — limited preview, not a full book.
- **Borrow / access restricted** — lending, login, institutional, or other restrictions.
- **Unavailable / unverified** — link is broken, access is unclear, or validation has not completed.

The source's terms and the specific work's rights determine whether a record can be imported, linked, cached, or redistributed. Default to linking to the provider's official reader/download rather than copying book files into Sahadhyayi.

## 2. Current baseline and existing integration points

The current code review documented these relevant paths:

- `src/components/library/BooksCollection.tsx` — coordinates catalog and external search results; Libgen is called separately.
- `src/hooks/useBookSearch.ts` — calls `search-books-preview` and sends selected results to `save-selected-books`.
- `supabase/functions/search-books-preview/index.ts` — current four-provider preview aggregator.
- `supabase/functions/search-books/index.ts` — another search/save path; confirm its production callers before altering it.
- `supabase/functions/save-selected-books/index.ts` — selected-book persistence and duplicate checks.
- `src/hooks/useLibrary.ts` — additional direct-write path to audit.
- `src/hooks/useLibraryBooks.ts` — completeness-based ordering, not catalog-wide deduplication.
- `src/utils/searchExternalSources.ts` — adapts and filters preview results.
- `src/utils/libgenApi.ts` — separate Libgen path.
- `src/components/library/BookSelectionModal.tsx` — selection UI.

The first implementation step is to re-confirm these paths on the current branch and search for every read/write to `books_library`. The repository may have changed since the earlier audit. Do not assume an old or archived route is deployed.

## 3. Provider roadmap

### P0 — Audit and harden current providers first

| Provider | Role | Required changes |
|---|---|---|
| Open Library | Broad book/edition metadata; official reading or borrowing links where available | Preserve provider ID, edition ID, all available ISBNs, language and edition fields. Use cover IDs/URLs carefully. Treat availability as separate from metadata. Follow API usage guidance and cache appropriately. |
| Google Books | Discovery metadata, descriptions, covers, previews and some access information | Store preview separately from full text. Never infer that a preview URL is a downloadable PDF. Keep volume ID and ISBNs. |
| Project Gutenberg via Gutendex | Public-domain ebooks and format links | Store Gutenberg ID and all supported format URLs; do not filter only for PDF. Display format and source attribution. Apply territory-specific rights caution where relevant. |
| Internet Archive | Catalog metadata and some full text or lending records | Stop constructing a PDF URL from an identifier. Inspect item metadata/file listings and access flags; distinguish downloadable, borrow-only, restricted and unavailable. Respect provider terms and rights. |
| Libgen (existing separate search path) | Legacy/external discovery path | Do not automatically ingest, download, or promote a file just because a search result exists. Keep out of the new automatic open-access ingestion pipeline unless an item's authorization and rights can be established. Consider disabling or clearly isolating this path after a product/legal review. |

### P1 — Standard Ebooks

**Purpose:** A high-quality collection of carefully produced public-domain ebooks, especially literature.

**Integration approach:**
1. Start with the officially public New Releases RSS/Atom feed for discovery; parse it using a robust XML/Atom parser.
2. Investigate the official OPDS feed at `https://standardebooks.org/feeds/opds` and negotiate OPDS 2.0 using `Accept: application/opds+json` where appropriate.
3. Do not assume every feed or the entire catalog is freely available for automated access. Standard Ebooks documents that new-release feeds are open to everyone, while other feeds can require Patrons Circle access; eligible open-source projects can contact them about access.
4. Ask for/confirm permitted access to a broader feed before relying on it for bulk catalog sync. Do not work around feed restrictions.
5. Map feed identifiers, title, contributors, language, description, cover, publication/update dates, official ebook page, and each advertised format (EPUB, AZW3, kepub or other formats if actually supplied).
6. Keep the official download/page URL; do not mirror the ebook file by default.
7. Verify the URL and MIME/format, and retain source provenance and license/public-domain notes where supplied.
8. On updates, upsert by stable Standard Ebooks identifier; do not create a new record on every feed poll.

**UI:** Add a source label such as “Standard Ebooks,” a format chip, “Download from source,” and an attribution link. Do not show “PDF” unless a PDF is actually provided.

### P1 — OpenStax

**Purpose:** Textbooks for STEM, economics, social sciences and other educational categories.

**Integration approach:**
1. Start with a curated provider registry of official OpenStax book pages and official formats rather than assuming a general-purpose public catalog API exists.
2. Confirm current official discovery endpoints or feeds before implementing automated catalog-wide crawling.
3. For each book, capture title, contributors, subject, edition/version, ISBN where available, language, official book page, online-reader URL, PDF URL if officially provided, publication/revision date, and attribution/licence statement.
4. Preserve OpenStax attribution and a link to the free version.
5. Record the license at the specific book/asset level. OpenStax commonly publishes under CC BY-NC-SA; this is not a blanket permission for commercial reuse. Before any monetization, adaptation, redistribution or content hosting, have the intended use checked against the actual book license and applicable terms.
6. Link to official downloads by default; do not strip license/attribution notices.
7. Use a manually reviewed starter list, then maintain it through a controlled update process. Detect edition updates as new or revised editions rather than silently overwriting user reading progress.

**UI:** Add an “Open textbook” / “Educational” source category, subject filters, edition, online reader and official download links. Do not claim all textbooks have the same license without reading the specific book's terms.

### P2 — Wikisource / MediaWiki API

**Purpose:** Public-domain and freely licensed source texts, classics, historical works, and multilingual literature.

**Integration approach:**
1. Use the official MediaWiki API against the appropriate Wikisource language project. Do not hardcode English Wikisource as the only source.
2. Use search/query endpoints to discover pages, then retrieve page metadata, canonical page URL, language, namespace, categories, author/contributor information and available export/format links.
3. Model a Wikisource work/page as a source record; do not assume every page is a complete standalone book. Multi-page works and index pages may need grouping.
4. Read page-level or work-level copyright/license information when available. A source site's general free-content policy does not eliminate the need to check specific works, scans, translations, and illustrations.
5. Prefer official page/read links. Only generate or store EPUB/PDF export links if the project provides a supported route and the format has been verified.
6. Preserve the original-language title and script. Do not transliterate titles as the only stored form.
7. Apply API etiquette, request limits, caching and backoff. Do not scrape page HTML if an API or supported export endpoint supplies the needed data.

**UI:** Add language and original-script search, “Read on Wikisource,” work/volume grouping and a clear source attribution. Mark format availability accurately.

### P2 — OpenAlex

**Purpose:** Scholarly works and research publications, not a general fiction-ebook source.

**Integration approach:**
1. Use the official `https://api.openalex.org` Works API to search and filter scholarly works; request only required fields.
2. Use a free API key stored as a server-side Supabase secret for a production integration, even though basic queries can work without one. Never expose the key in browser code or logs.
3. Map title, authors, publication year, DOI, OpenAlex work ID, type, language if available, abstract/inverted abstract when permitted, source/venue, OA status, license information when available, and official landing/full-text locations.
4. Treat an OpenAlex work record as scholarly metadata, not proof that the whole work is legally downloadable.
5. Prefer an official repository or publisher location with a clear OA/license status. Store DOI and source URLs. If the API exposes eligible full text/content functionality, check current pricing, rate limits and terms before using it; do not assume bulk PDF retrieval is free.
6. Never label a journal article as a complete ebook. Use categories such as “Research,” “Article,” “Book chapter,” or “Book” based on actual type metadata.
7. Implement pagination, selective fields, rate-limit handling, exponential backoff on 429/5xx and daily usage monitoring.

**UI:** Add a Research filter and a work-type badge. Separate “Read article,” “Open repository copy,” and “Download full text” actions.

## 4. Shared architecture

Implement a provider adapter architecture instead of placing provider-specific logic in the React components.

```text
Library Search / Scheduled Import
              |
       Provider Registry
              |
  +-----------+------------+-------------+
  |           |            |             |
Open Library  Gutenberg  Standard Ebooks ... OpenStax / Wikisource / OpenAlex
  |           |            |             |
  +-----------+------------+-------------+
              |
      Provider Adapters
              |
  Canonical Metadata Normalizer
              |
      Rights & Access Classifier
              |
      Duplicate / Edition Matcher
              |
       Link & Format Validator
              |
        Quality Ranker
              |
   Search Results / Review Queue
              |
      Shared Save Service
              |
        Supabase Catalog
```

### Provider adapter contract

Each adapter should return the same internal shape. Suggested TypeScript type (adapt to existing project conventions rather than copying blindly):

```ts
type ImportCandidate = {
  provider: string;
  providerRecordId: string;
  providerRecordUrl: string;
  title: string;
  subtitle?: string | null;
  authors: string[];
  contributors?: Array<{ name: string; role?: string }>;
  description?: string | null;
  identifiers: {
    isbn10?: string[];
    isbn13?: string[];
    doi?: string | null;
    providerIds?: Record<string, string>;
  };
  language?: string | null;
  edition?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
  subjects?: string[];
  recordType: "book" | "textbook" | "article" | "chapter" | "work" | "unknown";
  access: {
    status: "download" | "read_online" | "preview" | "borrow" | "metadata_only" | "unknown";
    officialPageUrl?: string | null;
    formats: Array<{
      format: string;
      url: string;
      verifiedAt?: string | null;
      status: "verified" | "unverified" | "unavailable";
    }>;
  };
  rights: {
    licenseName?: string | null;
    licenseUrl?: string | null;
    publicDomainStatus: "explicit" | "claimed" | "unknown" | "not_public_domain";
    territoryNotes?: string | null;
    redistributionAllowed: "yes" | "no" | "unknown";
    evidenceUrl?: string | null;
  };
  coverUrl?: string | null;
  metadataCompleteness: number;
  warnings: string[];
};
```

The adapter must not invent fields that the provider does not supply. Keep the raw provider payload in logs or short-lived diagnostics only where privacy, size, and provider terms permit; store only the fields needed for product behavior and traceability.

### Core shared services

1. **Provider registry:** provider ID, enabled state, supported query modes, rate limits, terms/attribution URL, and whether the adapter supports search, scheduled sync, full text, or metadata only.
2. **Normalizer:** Unicode-aware whitespace/punctuation normalization, ISBN validation, language codes, contributor roles, date parsing, and preserved original display strings.
3. **Rights/access classifier:** classifies the specific link/format; missing license means unknown, not automatically public domain.
4. **Matcher:** links same source IDs and validated ISBNs first; then normalized title + compatible author + language/edition; fuzzy candidates go to review. Same title alone is never enough.
5. **Validator:** safe HTTP(S) URL checks, redirects, content-type/format checks, timeouts, cached status and re-check timestamps. Do not download whole books just to test links.
6. **Ranker:** separate identity confidence, metadata completeness, access quality, provenance, and rights confidence. A quality score must not override the rights gate.
7. **Shared persistence service:** every write path must call the same deduplication and validation policy. Make repeated imports idempotent.
8. **Audit/review service:** stores why a candidate was accepted, linked to an existing edition, held for review or rejected.

## 5. Database design proposal — inspect before migrating

First inspect current Supabase schema, existing columns, indexes, foreign keys, RLS, and all readers/writers. Reuse existing equivalent columns. Only then write a minimal migration.

Potential tables/fields:

### Provider/source records

A separate source mapping table is preferable if one canonical catalog entry can have metadata from several providers:

- `id`
- `book_id` (FK to the canonical/edition record)
- `provider`
- `provider_record_id`
- `provider_record_url`
- `raw_identifier` / external IDs (or structured JSON where appropriate)
- `source_title`, `source_authors` only if needed to preserve conflicting provider metadata
- `rights_evidence_url`, `license_name`, `license_url`
- `last_seen_at`, `last_checked_at`, `source_status`

Add a unique constraint on `(provider, provider_record_id)` only after checking existing duplicates and null behavior. Do not impose uniqueness on normalized title alone.

### Edition/access records

Depending on the existing schema, model edition/format details in separate tables or extend the current book record with:

- edition/version, language, translator, publisher, ISBNs, record type;
- official landing URL;
- access status and last validation time;
- format URL and format type;
- license/rights status and attribution requirements.

Do not collapse work, edition, and file into a single identity. A single work may have multiple editions and formats.

### Import audit/job records

Track import run ID, provider, query or sync cursor, started/completed time, result counts, rate-limit/error counts, skipped/reviewed/inserted/updated counts and a safe error summary. Never log API keys or signed/private URLs.

## 6. Import modes

### Mode A — Interactive search (first priority)

1. User searches from Library.
2. Enabled providers run in parallel with per-provider timeout and concurrency limits.
3. One slow provider should not block results from the others.
4. Adapters normalize candidates.
5. Results are grouped into likely work/edition clusters; each provider/source remains visible.
6. The UI labels reading access, file format, language, source, and confidence.
7. User selects a candidate.
8. The server re-runs duplicate matching and rights/access checks before save.
9. If an equivalent edition exists, attach the provider source to it or offer the existing result rather than creating another row.
10. Return the saved canonical/edition ID to the UI.

### Mode B — Curated catalog sync (second priority)

Use for sources that support reliable feeds or curated lists, starting with Standard Ebooks' publicly accessible new-release feed and a curated official OpenStax list.

- Run a small scheduled job with a saved cursor or last-seen timestamp where supported.
- Fetch only new/changed records.
- Normalize, validate and deduplicate before upsert.
- Send ambiguous or rights-unknown records to review.
- Keep source links and attribution.
- Record job metrics and failures.
- Never import an entire source corpus until usage terms, scale, storage and rights have been reviewed.

### Mode C — Backfill existing catalog (later)

Run a dry-run audit across existing rows, identify duplicates and broken access links, and create a review report. Do not combine backfill cleanup with new provider rollout. No automatic hard deletion.

## 7. Duplicate detection and quality scoring

### Matching order

1. Same stable provider ID — strong source-record identity.
2. Same validated ISBN — strong edition-level identity.
3. Same DOI for scholarly works — strong identifier for that publication, but not necessarily a whole book.
4. Normalized title + compatible author/contributor + language/edition evidence.
5. Fuzzy title/author candidates — manual review unless confidence has been measured and validated.

Preserve differences in language, translation, volume, abridgement, publisher, and edition when meaningful. Keep work-level grouping separate from edition-level deduplication.

### Quality dimensions

Score these independently and expose reason codes:

- identity confidence;
- metadata completeness and cross-source consistency;
- provider provenance;
- validated reading/download access;
- cover validity;
- rights evidence and clarity;
- edition/language completeness.

Rights are a gate, not merely points in a score. A high-quality record with unknown rights may be displayed as metadata with a provider link but must not be automatically mirrored or labeled freely downloadable.

### Canonical record selection

Prefer the most accurate metadata record with a stable source identity, compatible edition/language, and useful verified access. Merge non-conflicting metadata while retaining provenance. Do not overwrite stronger metadata with empty fields. Do not choose a canonical row solely because it has a cover or a PDF-shaped URL.

## 8. UI and search behavior

### Search controls

- Search all eligible providers by default, with provider-specific filters.
- Filters: Books, Textbooks, Research, Language, Read online, Download available, Preview, Borrow/restricted, Source.
- Sorting: relevance, metadata quality, newest publication where meaningful, and verified access.
- Make provider outages visible only as a concise partial-results note, not as a total search failure.

### Result card

Each card should show:
- title, authors/contributors, edition/year, language and record type;
- cover if valid, with a neutral fallback if absent;
- source attribution;
- access badge and actual available formats;
- license/rights note when relevant;
- actions appropriate to access status.

Avoid labels like “Free PDF” unless a valid full-book PDF has actually been verified and the specific source/license supports offering it.

### Duplicate groups

When multiple sources point to the same edition, display one grouped result with “Sources: …” and the best valid access route. If editions differ, show an edition selector rather than silently merging them.

## 9. Security, reliability and provider etiquette

- Make provider calls from Supabase Edge Functions/server-side code where keys or secret configuration are involved.
- Store API keys in Supabase secrets; never in Vite `VITE_*` browser-exposed environment variables.
- Validate remote URLs against SSRF risks: only HTTP(S), block localhost/private IP ranges and unsafe redirects, and limit redirects/timeouts.
- Use per-provider timeouts, concurrency caps, retry with exponential backoff, and respect 429/Retry-After.
- Cache provider responses and link checks within terms; avoid re-fetching the same query on every keystroke.
- Set payload and result-count limits; sanitize descriptions and never render provider HTML unsafely.
- Do not proxy copyrighted files through Sahadhyayi unless rights and terms explicitly allow it.
- Keep user-facing “read/download” links pointed at official sources by default.
- Add observability without storing secrets or unnecessary user search history.

## 10. Rollout phases

### Phase 0 — Audit (no production writes)
- Confirm current branch and every book insert/update/delete/query path.
- Inspect schema, RLS, foreign keys and user references.
- Verify active Edge Function callers and deployments.
- Test each provider's current API/feed, rate limits, terms, and example payloads.
- Record current duplicate rate, source coverage, failed links and metadata completeness.

**Exit:** written integration map, baseline metrics, and no app/database changes.

### Phase 1 — Shared import contract and provider adapters
- Add the internal candidate type and provider registry.
- Refactor existing providers into adapters without changing UI behavior.
- Implement common normalization and structured errors.
- Add unit tests for missing fields, multiple languages, ISBN variants, weird punctuation and malformed URLs.

**Exit:** existing providers return a common schema; old search behavior is preserved.

### Phase 2 — Rights/access and dedup foundation
- Implement access-status and rights classification.
- Add candidate grouping and idempotent shared save logic.
- Audit and route every write path through the shared service.
- Add dry-run duplicate reports; no bulk archive/delete.

**Exit:** repeated imports do not create duplicate source records; ambiguous variants remain separate.

### Phase 3 — Standard Ebooks pilot
- Parse public new-release feed.
- Confirm access scope and terms before broader OPDS catalog ingestion.
- Validate format links and stable IDs.
- Test incremental sync, attribution, duplicate behavior and provider outage handling.

**Exit:** pilot records are traceable, repeatable and correctly labeled.

### Phase 4 — OpenStax curated catalog
- Add a curated official textbook registry.
- Capture per-book license/attribution, edition, official reader and verified formats.
- Have the license/use policy reviewed before any commercial use, adaptation or mirroring.

**Exit:** textbooks show correct source, edition, access and license information.

### Phase 5 — Wikisource adapter
- Support selected Wikisource language projects.
- Model work/page/volume relationships and page-level rights evidence.
- Test multilingual titles and scripts.

**Exit:** works are discoverable without flattening volumes or losing language distinctions.

### Phase 6 — OpenAlex research adapter
- Add server-side key configuration, query filters, rate-limit monitoring and article/book type mapping.
- Prefer official OA repository links; do not assume every result has a downloadable full text.
- Validate article vs book vs chapter display and rights/access status.

**Exit:** scholarly results are clearly distinguished from ebooks and have truthful access labels.

### Phase 7 — Admin review, sync monitoring and expansion
- Add a restricted review queue for rights-unknown items, ambiguous duplicates, malformed metadata and failed links.
- Add import-run dashboard and alerts for repeated provider failures or unusual insert spikes.
- Consider additional providers only after adapter tests, terms review, and measurable user value.

**Exit:** import errors and quality changes are visible, reversible and auditable.

## 11. Testing plan

### Unit tests
- ISBN-10/13 normalization and check-digit validation.
- Unicode, Hindi/non-Latin text, diacritics, punctuation and subtitle normalization.
- Provider payloads with missing authors, IDs, language, covers or format URLs.
- Same title/different author; same work/different language; translation; revised edition; volume/chapter.
- Access classification for PDF, EPUB, HTML reader, preview, borrow, restricted, dead link and unknown content type.
- License missing vs explicit public domain vs Creative Commons restrictions.
- Sanitization and safe URL validation.

### Integration tests
- Each adapter against saved fixture payloads.
- Provider timeout/429/5xx does not block other providers.
- Repeat import is idempotent.
- Same edition from multiple sources groups into one result while retaining all source links.
- User selection revalidates server-side and never trusts client-supplied rights/access flags.
- API keys never appear in browser bundles or logs.
- RLS prevents non-admins from accessing import-review controls.

### Staging acceptance tests
- Import a small hand-reviewed sample from each provider.
- Verify every displayed download/reader link and attribution manually.
- Verify existing shelves, progress, notes, reviews, and groups remain attached after deduplication.
- Compare before/after row counts and source mapping counts.
- Test rollback before any production backfill.

## 12. Success metrics

Track by provider and overall:
- search success rate and median latency;
- provider timeout/rate-limit rate;
- percentage of results with stable source IDs;
- percentage with verified read-online or download links;
- percentage with clear license/rights status;
- duplicate creation rate per 100 saves;
- metadata completeness and cover validity;
- percentage of candidate duplicate clusters accepted by reviewers;
- user click-through to official reader/download;
- scheduled sync inserts, updates, skips and errors.

Do not optimize only for the number of books. A smaller catalog with reliable metadata, valid links, clear rights and low duplication is more useful than a larger catalog filled with broken or misleading records.

## 13. Recommended first coding-agent task

Implement **Phase 0 only**. Ask the coding agent to:

1. Reinspect the current branch and all book import/search/write paths.
2. Map current database schema, RLS, foreign keys and references to book IDs.
3. Verify official provider documentation and test a small sample from each candidate provider.
4. Confirm which Standard Ebooks feeds are accessible for this project; do not bypass feed restrictions.
5. Confirm OpenStax discovery method and license evidence at book level.
6. Confirm Wikisource API routes per language project and supported export/format links.
7. Confirm current OpenAlex API fields, rate limits, and the cost/terms for any content downloads.
8. Produce a proposed schema/adapter design, test plan and risks.
9. Make no app-code changes, migrations, bulk imports, deletions or production behavior changes.
10. Report verified facts separately from assumptions and identify anything needing human/legal review.

Only after Phase 0 is reviewed should implementation begin, starting with the shared adapter/normalizer and a Standard Ebooks new-release pilot.
