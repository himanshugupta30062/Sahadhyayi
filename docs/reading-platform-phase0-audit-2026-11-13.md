# Reading Platform Phase 0 — Repository Audit

Date: 2026-11-13
Repository: `himanshugupta30062/Sahadhyayi`
Base: `main`

## Audit findings (source evidence)

Sahadhyayi already has substantial reading functionality. Do not create parallel systems.

| Area | Existing code/evidence | Status / next action |
|---|---|---|
| Reader bookshelf | `useUserBookshelf`, `EnhancedBookshelf`, `usePersonalLibrary`, `user_bookshelf` | Partial: statuses currently typed as `want_to_read / reading / completed`; inspect DB constraints before adding DNF |
| Page progress | `useReadingProgress`, `useSaveReadingProgress`, `reading_progress`, local progress storage | Partial: page tracking exists; validate bounds, completion sync and history |
| Reviews | `BookReviews`, `useBookReviews`, `book_reviews` migration, persistence tests | Present: unique reader/book, bounded text, spoiler reveal and owner RLS |
| Journal / private notes | `BookReadingJournal`, `reader_bookmarks_private_journal` migration | Present in code; verify privacy and mobile flow |
| Goals/challenges/streaks | `useReadingGoal`, `useReadingChallenges`, streak cards, challenge persistence | Present; audit timezone/reset semantics and metric consistency |
| Reading groups | group foundation/lifecycle, invites/moderation, shared board, chapter discussions migrations | Strong foundation; verify spoiler boundary server-side and membership policies |
| Goodreads | `useGoodreadsIntegration`, guest import migration | Integration exists; test mapping, duplicates, error report and export parity |
| Discovery/recommendations | book search, recommendation hooks/dashboard | Partial; mood/pace preference taxonomy and transparent explanations remain candidates |
| Reading activity | activity-day migrations and backfill | Present; validate event sources and timezone behavior |

## Priority implementation sequence

1. **Reliability before expansion:** focused tests and workflows for shelf, progress, reviews, import, goals, and chapter discussions.
2. **Shelf model completion:** DNF, owned-copy state and user tags only after verifying constraints and existing columns.
3. **Progress correctness:** enforce page bounds and completion transitions; avoid introducing a second progress/event model until existing schema is understood.
4. **Spoiler safety:** validate authorization and progress gates at the database/API boundary, not only in UI.
5. **Discovery:** mood/pace/language/length filters and explainable recommendations.
6. **Insights:** accurate Year-in-Reading and shareable wrap based on trusted activity data.

## Engineering guardrails

- Reuse current hooks, tables, RPCs and components.
- No schema changes without checking deployed schema, migrations and RLS.
- Never expose private journal, bookshelf, or progress through public profile/feed by default.
- Every mutation gets ownership validation and regression tests.
- Run focused Vitest tests, typecheck/build, and relevant CI checks before merge.
- Mark feature complete only after end-to-end behavior is verified, not merely because a component exists.

## First implementation slice

The first code slice should be **bookshelf status and progress consistency**: confirm allowed statuses in migrations, then add DNF safely (if absent), make status changes update the correct progress/read dates, and cover it with hook + database tests. This is lower risk and more foundational than adding another page or a new tracking table.
