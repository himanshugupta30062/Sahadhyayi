# Quotes Cloud Persistence — Implementation Specification

## Status
Implementation preparation. No database migration or client behavior change has been applied yet.

## Verified current behavior
- `src/contexts/QuotesContext.tsx` stores quotes in localStorage under `savedQuotes:<userId>` (or guest key).
- Quote IDs are currently `Date.now()` numeric values.
- Quote shape is imported from `src/contexts/quotesHelpers`.
- `src/hooks/useReadingJournal.ts` consumes `useQuotes()`; it currently assigns quote journal entries `new Date().toISOString()` at render time (must preserve actual quote timestamp instead).
- `src/components/books/BookReader.tsx` saves selected passages using `addQuote(text, bookTitle, undefined, { bookId, page, location })`.
- Existing saved quotes must remain readable; account switching currently scopes localStorage keys.

## Scope
1. Persist signed-in users' quote collection to Supabase; guest collection remains local until sign-in.
2. Preserve source, book ID, page, reading location, note, stable ID and created timestamp.
3. Merge legacy local quotes once, without duplicate inserts; retain local copy until server-confirmed migration.
4. Keep quotes private by default; owner-only RLS.
5. Provide loading/sync/error state and retry; never silently report success after server failure.
6. Update Reading Journal to use quote's actual created timestamp.
7. Keep existing BookReader `addQuote` API compatible.
8. Add tests for local migration/merge, account isolation, deduplication, RLS assumptions, failure/retry and timestamp preservation.

## Before migration
- Inspect existing quote-related tables/functions and Supabase migration history in repository and connected project.
- Confirm no existing production quote table or conflicting schema.
- Confirm auth profile/table conventions, generated database types, client query conventions and test setup.
- Choose stable UUID quote IDs (or retain legacy ID as a separate migration key) and a unique owner + legacy identifier constraint.
- Do not add an arbitrary table until the schema audit is complete.

## Candidate data contract (subject to schema audit)
- id: uuid primary key
- user_id: uuid references auth.users(id) on delete cascade
- text: non-empty quote text
- source: nullable book title/author attribution as currently modeled
- note: nullable personal note
- book_id: nullable stable catalogue identifier
- page: nullable positive integer
- location: nullable reader locator
- legacy_id: nullable text for idempotent import
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

## Security
- RLS enabled.
- SELECT/INSERT/UPDATE/DELETE only where `auth.uid() = user_id`.
- No public quote access from this table; sharing must create/use an explicit social post with audience policy.
- Never trust user_id from browser payload; derive from authenticated session.
- No service-role key in client.

## Rollout
- PR 1: schema audit + typed model/merge tests and this spec.
- PR 2: additive migration (only after audit) + RLS + indexes + generated types.
- PR 3: provider sync implementation with legacy import and rollback-safe behavior.
- PR 4: journal timestamp fix and UX states, tests.
- Staged rollout; verify no legacy quote loss before removing local fallback (do not remove in this project).

## Acceptance
- Save quote while signed in → survives reload and another device.
- Guest quotes remain available; sign-in migration merges safely.
- Account A cannot read/change Account B's quotes.
- Duplicate import or retry does not create duplicate quote.
- A cloud failure is visible and retryable; local quote is retained.
- BookReader saves quote with original book/page/location.
- Journal shows actual saved timestamp, not current render time.
- Existing quote cards/social publishing remain compatible.
