# Reading-platform feature audit (Fable / StoryGraph / Hardcover)

**Scope:** repository-first audit to avoid duplicating features. This records implementation evidence from the current codebase; presence of a component is not proof every workflow is complete or production-ready.

## Existing foundations (confirmed by source paths)

| Capability | Existing implementation | Next audit / enhancement |
|---|---|---|
| Social posts and feed | `src/components/social/{SocialFeed,EnhancedSocialFeed,FeedComposer}.tsx`; `src/hooks/useSocialPosts.ts`; post persistence/visibility tests | Validate Following vs discovery ranking, media composer, tagging, pagination and mobile UX end-to-end |
| Reactions and bookmarks | `useSocialPostReactions.ts`, `useSocialPostBookmarks.ts`, `LiteraryReactionPicker.tsx` | Confirm counts, optimistic state, accessibility and abuse controls |
| Book reviews | `src/components/books/BookReviews.tsx`, `src/hooks/useBookReviews.ts`; `book_reviews` migration and persistence tests | Add rating dimensions/reaction summaries only after schema + aggregation design |
| Reading progress | `src/hooks/useReadingProgress.ts`, `useChapterProgress.ts`, `useReadingTracker.ts` (if present) | Unify progress with shelf status; validate page bounds and completion transitions |
| Bookshelf | `src/hooks/useUserBookshelf.ts`, `EnhancedBookshelf.tsx`, `usePersonalLibrary.ts` | DNF/custom tags/owned copies; inspect database status constraints before changing |
| Goals / challenges / streaks | `useReadingGoal.ts`, `useReadingChallenges.ts`, `ReadingChallengesSection.tsx`, `ReadingStreakCard.tsx`; challenge persistence migrations/tests | Check reset dates, timezone boundaries, progress correctness, and empty/error states |
| Groups / buddy-style reading | `ReadingGroups.tsx`, `useGroupReadingBoard.ts`, `useGroupReadingDiscussions.ts`, `useReadingRoom.ts` | Audit structured schedules, 1:1 buddy flow, spoiler-safe discussion and membership RLS |
| Reading stats | `ReadingStats.tsx`, `DashboardStats.tsx`, `ProfileStats.tsx`, `LibraryStats.tsx` | Add visual year-in-reading/heatmap after defining trustworthy source-of-truth metrics |
| Goodreads integration | `useGoodreadsIntegration.ts`; migration `20261018220000_allow_guest_book_import.sql` | Confirm supported CSV mapping, duplicate resolution, status/progress import and rollback/reporting |
| Discovery | `useBookRecommendations.ts`, dashboard recommendations and book search | Mood/pace metadata, recommendation explanations, preference controls |
| Content safety | `useTrustAndSafety.ts` | Book-level content-warning taxonomy, provenance/confidence, user hide filters |

## Prioritized next work

1. **Reliability pass:** run focused tests and inspect actual pages/flows for feed, reviews, progress, goals and groups. Fix broken or inaccessible interactions before adding parallel systems.
2. **Bookshelf completion:** DNF and page progress, with database constraints and migration-safe status handling; custom tags and owned copies as separate concepts.
3. **Review quality:** structured ratings (writing, plot, characters, pace) and optional emotional reactions; preserve existing text review and spoiler controls.
4. **Reading community:** scheduled club reads and buddy reads with spoiler boundaries and clear progress milestones.
5. **Personalization:** mood/pace discovery and transparent recommendation controls.
6. **Curation & insights:** reader lists/tier lists and a shareable Year in Reading dashboard.
7. **Safety & migration utility:** content warnings/preferences and robust Goodreads import validation.

## Engineering guardrails

- Reuse existing hooks/components; avoid parallel feeds, review tables, goal systems, or group models.
- Inspect live schema and RLS before migrations. Never trust client-side ownership checks alone.
- Keep private shelves/goals private by default; public sharing should be explicit.
- Add unit/integration tests for mutations, authorization, empty/error states, and mobile interaction.
- Do not label a feature complete solely because a component or migration exists.

## Evidence paths

- Social: `src/components/social/`, `src/hooks/useSocialPosts.ts`, `src/__tests__/socialPostPersistence.test.ts`
- Reviews: `src/components/books/BookReviews.tsx`, `src/hooks/useBookReviews.ts`, `src/__tests__/bookReviewsPersistence.test.ts`
- Shelf/progress: `src/hooks/useUserBookshelf.ts`, `src/hooks/useReadingProgress.ts`, `src/__tests__/bookshelfAndProfile.test.tsx`
- Goals/challenges: `src/hooks/useReadingGoal.ts`, `src/hooks/useReadingChallenges.ts`, `src/__tests__/readingChallengesPersistence.test.ts`
- Groups: `src/components/social/ReadingGroups.tsx`, `src/hooks/useGroupReadingBoard.ts`, `src/hooks/useGroupReadingDiscussions.ts`
