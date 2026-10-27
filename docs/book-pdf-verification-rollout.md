# Book PDF verification: isolated rollout plan

## Safety contract

This feature is additive and must not change the existing behaviour of the public `books` bucket, `books_library`, Ultimate Book Finder search/save, personal shelves, PDF proxy, or Book Expert ingestion until the corresponding integration is separately reviewed and tested.

Implementation branch: `feature/book-pdf-verification`

## What this first slice adds

Migration `20261027120000_add_book_pdf_submission_quarantine.sql` adds:

- `public.book_pdf_submissions` as a private intake/workflow table.
- A new private `book-pdf-quarantine` Storage bucket with a 50 MiB limit and PDF MIME allowlist.
- RLS that lets authenticated users create a submission only for themselves, view their own submissions and upload/read only their own quarantine objects.
- No client update policy for workflow status, validation results, match confidence or approval fields.
- An optional target `books_library.id` for Finder-originated uploads, without changing any existing book rows.

The migration deliberately does **not** add a public PDF URL, write to `books_library`, deploy an Edge Function, change existing bucket policies, or enable public download. The uploaded bytes remain private until a future reviewed publishing path approves the file.

## Expected Storage object path

`{auth.uid()}/{submission_id}/source.pdf`

The client should generate a UUID, insert the submission row with that UUID and exact path, then upload to the new bucket. The database constraint and RLS policy enforce the path pattern. The client must not be allowed to set workflow results or approve the file.

## Status lifecycle

`uploaded → queued → scanning → extracting → matching → approved | needs_review | rejected | failed`

A trusted worker/service-role function (not a user client) must own status transitions and update `detected_metadata`, `validation_findings`, `match_confidence`, and review fields. A status named `approved` alone must not make a file public; rights verification and an explicit publishing operation are still required.

## Follow-up implementation slices

1. Add a submission API that validates the authenticated user, input fields, selected catalogue book and rights attestation.
2. Add the upload UI as a new Library contribution route; do not replace the existing Finder or upload helpers.
3. Add an isolated worker for PDF parsing, malware scanning, selective OCR, metadata extraction and candidate matching.
4. Reuse `src/utils/catalog/bookIdentity.ts` for candidate normalization, then require explicit evidence and rights checks before publishing.
5. Add a separate `book_files` association only after its edition, access, license and duplicate semantics have been reviewed.
6. Add an admin review workflow and cleanup/retention process.
7. Integrate the Finder action behind a feature flag after the new route and backend pass tests.

## Verification checklist

Run in a disposable local/test Supabase project before applying this migration to any shared environment:

- [ ] Migration applies cleanly to a fresh database.
- [ ] Migration applies cleanly to a recent schema snapshot.
- [ ] Existing `books` bucket public/private settings and policies are unchanged.
- [ ] Existing `books_library` row counts and contents are unchanged.
- [ ] Anonymous users cannot read submissions or quarantine files.
- [ ] User A cannot read or upload into User B's path.
- [ ] Users cannot insert a submission without the rights attestation.
- [ ] Users cannot set status to approved or write validation metadata.
- [ ] Wrong storage paths, non-PDF MIME types and files above 50 MiB are rejected.
- [ ] A Finder submission requires a valid target book ID.
- [ ] Existing search, save-selected-books, shelves, PDF proxy and Book Expert smoke tests pass.
- [ ] `npm run lint`, `npm test`, and `npm run build` pass.
- [ ] CI checks pass on the pull request before merge.

## Rollback

Do not run a destructive rollback against a live environment if submissions may already exist. During the feature-branch phase, simply do not apply the migration to production. If a test database needs resetting, export any test submissions first, then remove the new table, policies and `book-pdf-quarantine` bucket in that disposable environment only.

## Release policy

No production migration, Edge Function deployment, default-branch merge or Cloudflare production deploy is part of this initial slice. Merge only after the PR has been reviewed, CI passes, and the subsequent UI/worker integration has a test plan.
