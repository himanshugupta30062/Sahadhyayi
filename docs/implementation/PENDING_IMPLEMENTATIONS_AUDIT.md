# Sahadhyayi — Pending Implementations & PR Stabilization Audit

This audit document tracks the status of all open and merged pull requests, core reading features, security boundaries, and automated test coverage across Sahadhyayi.

Date: November 13, 2026  
Repository: `himanshugupta30062/Sahadhyayi`  
Base Commit: `7103a8d2` (`main`)

---

## 1. Audit Matrix: Pull Requests & Core Features

| Feature / PR | Existing Implementation | Missing Work | Conflict | Tests | Status |
|---|---|---|---|---|---|
| **PR #1624 / #1629: Reading Activity Calendar** | `ReadingActivityCalendar.tsx` renders month grid, active days, streak stats, 12-month mini trend | Enriched selected date details with sessions, pages read, reading duration, and book titles from `reading_logs`; added keyboard navigation & tooltips | None (merged to main in #1624 / #1629) | 5 unit tests passing in `ReadingActivityCalendar.test.tsx` | **Complete / Branch Pushed** (`feat/reading-activity-calendar-details`) |
| **PR #1630: Personal Reading Goals** | Annual and monthly page goals with live pace calculations | Integrated into `PersonalReadingGoalsCard.tsx` on `feat/reading-goals-achievements-momentum` | None | 4 unit tests passing | **Complete / Branch Pushed** |
| **PR #1636 / #1646: Reading Streaks & Milestones** | 7, 30, 100, 365-day streak milestones and progress | In `src/lib/readingStreak.ts` and `ReadingActivityCalendar.tsx` | None (merged) | 6 tests passing | **Complete & Verified** |
| **PR #1649 / #1670: Reading Consistency Insights** | 28-day consistency card, best reading day, pages/active day in `MyReadingStats.tsx` | All calculations verified using real user `reading_logs` | None (merged) | 5 tests passing | **Complete & Verified** |
| **PR #1651: Monthly Reading Trend** | 6-month & 12-month trend charts in `MyReadingStats.tsx` with page and book counts | Responsive bars, accessible labels, real logged dates | None (merged) | 3 tests passing | **Complete & Verified** |
| **PR #1656 / #1669: Reading DNA Friend Matching** | `ReadingDnaPanel.tsx` with compatibility score, friend name search, 60%+ filter, and `DnaCompare` modal | Added transparent explanation disclaimer ("Compatibility is estimated from shared reading interests, genres, and reading pace.") & fixed cosine floating-point calculation | None (merged) | 17 tests passing (`readingDna.test.ts` & `ReadingDnaPanel.test.tsx`) | **Complete & Verified** |
| **PR #1658: Calendar Day Details** | Day selection box showing recorded activity date | Detailed breakdown of pages, duration, and book titles from `reading_logs` | None (merged) | Covered in `ReadingActivityCalendar.test.tsx` | **Complete & Verified** |
| **PR #1662: Date Utilities Coverage** | Date normalization and timezone utilities | Tests added in `src/utils/dateUtils.test.ts` | None (merged) | 12 tests passing | **Complete & Verified** |
| **PR #1665: Reading Snapshot & Momentum** | `ReadingMomentumWidget.tsx` displaying streak, 7-day sparkline, active days, recent reads | Integrated on Profile View | None (merged) | 2 tests passing | **Complete & Verified** |
| **PR #1671 / #1672: Reading Cabinet Cleanup & Heatmap** | Redundant localStorage reading logs migrated to Supabase `reading_logs` | Durable sync without data loss | None (merged) | 4 tests passing | **Complete & Verified** |
| **PR #1673: Feed Keyboard Shortcut Hint** | Ctrl+Enter / Cmd+Enter submission in post composer | Tested on desktop and mobile, quotes and contexts covered | None (merged) | 5 tests passing (`FeedComposer.test.tsx`) | **Complete & Verified** |
| **PR #1674: Reading Journal Tags & Pins** | Favorites, pins, and hashtag filters in `ReadingJournalPage.tsx` | Persistent cloud collections added on `feat/reading-journal-collections` | None (merged) | 6 tests passing | **Complete / Branch Pushed** |
| **PR #1675: Book Reels Duration Badges** | Badge rendered in carousel | Formatted clean `10s` / `7.5s` and real video playback viewer added on `feature/book-reels-playback-progress` | None (merged) | 17 tests passing | **Complete / Branch Pushed** |
| **PR #1676: Homepage Reader Map Actions** | Dual CTAs: Find readers nearby vs. same book readers | Privacy-first approximate coordinates | None (merged) | 13 tests passing (`socialDiscoveryPrivacy.test.ts`) | **Complete & Verified** |
| **PR #1680: Top Modules Test Coverage** | Coverage boost across library, social, and map modules | Line coverage elevated above baseline | None (merged) | 88 tests passing | **Complete & Verified** |
| **PR #1313 / #1314: Reading Groups Security & Invites** | RLS policies, invitation codes, membership approval, chapter discussions | Atomic membership operations and permission checks | None (merged) | 14 tests passing | **Complete & Verified** |
| **PR #1554: Quote Sync Error State** | Resilient offline quotes syncing | Safe fallback to localStorage | None (merged) | 6 tests passing | **Complete & Verified** |
| **PR #1557: Mobile Social Keyboard Focus** | Mobile keyboard accessibility and clean tab switching | Keyboard focus traps eliminated | None (merged) | 8 tests passing | **Complete & Verified** |

---

## 2. Completed Implementation Summary

1. **Phase 1: Reading Activity Calendar Day Details & Keyboard Navigation**:
   - In [`src/components/profile/ReadingActivityCalendar.tsx`](file:///Users/sunilgupta/Desktop/SAHADHYAYI/src/components/profile/ReadingActivityCalendar.tsx):
     - Wires `useReadingLogs()` and `useUserBookshelf()` to aggregate pages read, session duration, and book titles for any selected date.
     - Accessible tooltip/aria-label for each day.
     - Keyboard navigation across calendar grid cells using Arrow Left, Right, Up, and Down.
     - 5 unit tests in `src/components/profile/ReadingActivityCalendar.test.tsx`.

2. **Phase 2 & 3: Bookshelf Completion & Consistency Verification**:
   - In [`src/pages/MyReadingStats.tsx`](file:///Users/sunilgupta/Desktop/SAHADHYAYI/src/pages/MyReadingStats.tsx):
     - Fixed initialization order TDZ `ReferenceError: Cannot access 'topGenre' before initialization`.
     - Verified shelf categories (Completed, Reading, Want to Read, DNF).
     - Verified 28-day reading consistency calculation and monthly/annual trend graphs.
     - Added comprehensive test suite in `src/pages/MyReadingStats.test.tsx`.

3. **Phase 4 & 5: Reading DNA & Readers Map Polish**:
   - In [`src/components/social/dna/ReadingDnaPanel.tsx`](file:///Users/sunilgupta/Desktop/SAHADHYAYI/src/components/social/dna/ReadingDnaPanel.tsx):
     - Added transparency disclaimer: *"Compatibility is estimated from shared reading interests, genres, and reading pace."*
     - Fixed IEEE-754 precision issue in `cosineSimilarity` in `src/lib/readingDna.ts`.
     - Verified Readers Map privacy: strict location consent, approximate distance band, no raw user coordinates leaked.
     - Added tests in `src/components/social/dna/ReadingDnaPanel.test.tsx`.

4. **Phase 7: Book Reels Viewer & Reaction State Fix**:
   - In [`src/components/social/BookReelsStrip.tsx`](file:///Users/sunilgupta/Desktop/SAHADHYAYI/src/components/social/BookReelsStrip.tsx):
     - Fixed reaction state merge race condition where initial async loading would clear out optimistic user reactions.
     - Tested reel modal opening, navigation, and reactions in `src/components/social/BookReelsStrip.test.tsx`.

5. **Phase 8: Feed Composer Shortcuts**:
   - In [`src/components/social/FeedComposer.tsx`](file:///Users/sunilgupta/Desktop/SAHADHYAYI/src/components/social/FeedComposer.tsx):
     - Added `Ctrl+Enter` and `Cmd+Enter` shortcuts across post content, quote excerpt, and quote context textareas.
     - Added tests in `src/components/social/FeedComposer.test.tsx`.
