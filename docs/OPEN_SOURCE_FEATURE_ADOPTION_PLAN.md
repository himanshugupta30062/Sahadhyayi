# Sahadhyayi — Open-source Feature Adoption Roadmap

**Status:** Proposed / execution plan  
**Goal:** Adopt proven ideas from open-source reading platforms while preserving Sahadhyayi's existing architecture and user data.  
**Rule:** Audit → design → isolated implementation → tests → staged rollout. Do not copy entire applications or create duplicate sources of truth.

## Reference projects

- **BookWyrm** — social reading, book-centric reviews/quotes, shelves, group/community patterns. Reference: https://github.com/bookwyrm-social/bookwyrm
- **BookOrbit** — reading sessions, progress, analytics, achievements, highlights and Reading DNA. Reference: https://github.com/bookorbit/bookorbit
- **BookLore** — library organization, metadata and smart-shelf patterns. Reference: https://github.com/booklore-app/booklore
- **Reading Tracker (alentz333)** — TypeScript/Supabase reading tracker, clubs, CSV import and onboarding patterns. Reference: https://github.com/alentz333/reading-tracker

Use feature ideas and independently implement compatible behavior. Review license obligations before copying code; BookWyrm/BookOrbit are AGPL-family projects and BookOrbit has additional licensing terms.

## Existing Sahadhyayi foundations to reuse

- Reader / progress: `BookReader`, `useReadingProgress`, reading-progress storage and Supabase records.
- Notes / margins / highlights / bookmarks: existing journal, margin-note, highlight and `reader_bookmarks` implementations.
- Quotes: `QuotesContext.tsx` currently stores user-specific collections in localStorage; cloud persistence is a gap to assess/fix.
- Goals / streaks / challenges: `useReadingGoal`, `useReadingStreak`, `useReadingChallenges`, challenge and badge records.
- Discovery: recommendation Edge Function, catalogue, Reading DNA, `matchScore`, `DnaCompare`.
- Community: Social Feed, composer, reading groups, shared reading board, chapter discussions, events foundation, Reading Rooms.
- AI: Book Expert / Gemini / RAG.

A hook, migration, or planning document is not proof that a feature is deployed or end-to-end functional. Verify production migrations, RLS, RPCs, UI and tests first.

## Principles / guardrails

1. No duplicate reading-progress, goals, challenges, event, quote, or badge engines.
2. Stable book identifiers; never use title alone as identity.
3. User-owned data is private by default; sharing is explicit and reversible.
4. RLS and trusted RPCs enforce authorization; never trust client-supplied user IDs or counters.
5. Migrations are additive/backward-compatible and reviewed against production schema.
6. Feature flags or staged rollout for user-facing changes where practical.
7. Mobile-first, accessible UI and loading/empty/error/success states.
8. Each PR contains focused tests and a regression checklist.
9. Do not merge automatically or modify production data without review.

## Programme 0 — Baseline audit (P0)

**Deliverables:** Feature inventory (working/incomplete/missing), deployed schema/RLS/RPC map, baseline CI and coverage, mobile regression checklist, dependencies and rollback plan.

Audit: reader save/resume and cross-device behavior; quotes persistence; goals and timezone streaks; challenge/badge correctness; Reading DNA privacy; group membership and already-joined state; shared board/discussions/events; notification preferences and delivery; feed composer/media; moderation/block/report; Book Expert grounding/spoilers; library catalogue metadata.

**Exit:** Every feature has a verified implementation path, source of truth, authorization model and test, or is explicitly classified as missing.

## Programme 1 — Reading reliability (P0)

**Reference:** BookOrbit progress/session patterns.

- Harden save/resume for PDF and EPUB separately.
- Use user + stable book/edition identity.
- Controlled autosave and lifecycle save; debounce and idempotency.
- Resolve local/cloud conflicts and multi-tab races.
- Show saving/synced/offline/error states and retry.
- Align reader, book details, bookshelf and dashboard after mutations.
- Persist reader preferences appropriately.
- Mobile controls, accessibility and deep-link restoration.

**Tests:** open → advance → close → reopen; cross-device sync; offline/failed save; duplicate IDs/editions; PDF and EPUB independently; no false success.

## Programme 2 — Journal, quotes and highlights (P1)

**Reference:** BookOrbit annotations; BookWyrm book-centric quote/review patterns.

- Audit `QuotesContext.tsx`; migrate account quote collections from localStorage to Supabase with safe one-time import/merge and duplicate prevention.
- Keep source book, author, page/locator, attribution and actual timestamps.
- Reuse existing journal/margin/highlight/bookmark models; only add a table after proving the current schema cannot represent stable anchors.
- Search/filter entries by book, date, type, topic.
- Edit/delete/export own content.
- Stable EPUB locator and PDF page/position anchor; reopen exact passage.
- Private-by-default notes; explicit quote-card/feed publishing.
- No private note or journal text in public recaps/recommendations.

**Tests:** cloud persistence across devices; account isolation; exact anchor restoration; RLS; edit/delete/export; private content cannot leak to feed/profile.

## Programme 3 — Reading goals, analytics and Passport (P1)

**Reference:** BookOrbit heatmaps, streaks and achievements.

- Choose one authoritative goal record; local storage may cache only.
- Calculate streaks from trustworthy reading activity in user's timezone.
- Add weekly/monthly/yearly goals and calendar heatmap.
- Reading timeline from verified sessions/progress events.
- Personal stats: books completed, active reading days, measurable duration/pages only when real data supports it.
- Reading Passport with opt-in public fields: favourite genres/authors, completed books, selected badges, chosen quotes.
- Weekly/monthly/annual recap with privacy controls and no fabricated numbers.
- Extend existing challenge/badge engine; don't create another.

**Tests:** timezone boundaries/DST; data matches source records; missing duration/page totals omitted; private books excluded; goals sync; badge idempotency.

## Programme 4 — Reading Groups 2.0 (P0/P1)

**Reference:** BookWyrm groups and book-club workflows.

- Verify deployed shared board, chapter discussions and event foundations before extension.
- Book nomination + one-vote-per-member poll; deadline, change/withdraw before close, tie rules, moderator close/cancel, result and Up Next queue.
- Group reading plan: selected book, chapters/pages, milestones, due dates, prompts and progress.
- Integrate event schedule with existing events/Activity; RSVP, timezone, attendance and reminders.
- Chapter spoiler labels and chapter-specific discussion context.
- Group milestones derived from actual activity.
- Preserve active/inactive membership, owner/moderator capabilities, leave/join behavior and member-only access.
- Notification preference integration: global switch, category toggles, per-group mute, quiet hours, deduplication, rate limits; weekly digest opt-in only.

**Tests:** unauthorized poll writes; unique vote constraint; concurrency/tie; membership removal; non-member access; capacity/RSVP races; timezone; reminder idempotency and cancellation; mute/global opt-out respected.

## Programme 5 — Discovery and smart library (P1)

**Reference:** BookLore/BookOrbit smart shelves; Supabase reading tracker import.

- Rule-based and manual shelves reusing catalogue/shelf data.
- Filters only for metadata actually available: genre, language, author, format, status, availability, page count.
- Metadata enrichment via current providers with provenance and conflict-safe updates.
- Goodreads CSV import: parse, ISBN-first match, preview/unmatched review, map status/rating, duplicate-safe confirmation and summary.
- Improve recommendations using opted-in signals from genres, authors, completed/current/want-to-read and ratings.
- Explain recommendation reasons; label generic trending honestly; exclude blocked users/private data.

**Tests:** duplicate import idempotency; ISBN/title fallback matching; no destructive metadata overwrite; filters tolerate null metadata; recommendations trace to real signals and respect privacy.

## Programme 6 — Book-centred social experience (P1)

**Reference:** BookWyrm.

- Quote, Meet Life: quote + personal reflection + book attribution + designed card + audience control.
- Shared interpretations anchored to a quote/book.
- Reading Cabinet collections (private default, optional sharing).
- Composer polish: multiple images, compression, retry, alt text, book tagging, draft preservation and privacy controls.
- Complete report/block/mute/hide/moderation queue before scale-up.
- Preserve current posts/feed architecture; avoid parallel social system.

**Tests:** private-to-public transition explicit; attribution; upload failures/retry; block/mute feed filtering; report workflow; moderation audit; RLS.

## Programme 7 — Contextual Book Expert (P1)

**Reference:** in-reader AI assistance patterns; retain Sahadhyayi Gemini/RAG implementation.

- Invoke from selected passage/book/chapter context.
- Explain passage, vocabulary, background, chapter recap, compare ideas and find related books.
- Save user-selected AI insight to journal.
- Chapter spoiler boundaries; clear distinction between source-grounded and general knowledge.
- Never fabricate quotations/pages; preserve reader position; respect content processing rights.

**Tests:** passage context passed correctly; no spoiler leakage; citation/quote integrity; errors/retry; save-to-journal user ownership.

## Programme 8 — Offline/PWA (P2)

**Reference:** offline-first reading patterns.

- PWA shell and IndexedDB cache.
- Offline notes/bookmarks/progress queue; idempotent sync and conflict handling.
- Download/cache only content whose rights/access permit it.
- Storage controls, availability indicator, reconnect sync and clear error handling.

**Tests:** offline/online transitions; duplicate sync; conflict resolution; account switching; cache privacy; content permissions.

## Prioritized delivery waves

### Wave 0 — Safety and baseline
- Production schema/RLS verification.
- Group reliability regressions and already-joined state.
- Social post creation/feed/book navigation regression checks.
- CI baseline and high-impact flaky/failing tests.

### Wave 1 — Small, high-value wins
- Quotes cloud persistence.
- Goal persistence and streak correctness.
- Reading save/resume reliability.
- Smart shelf filters using existing fields.

### Wave 2 — Community engagement
- Book voting.
- Group reading plans/milestones.
- Events UI + notification preferences/reminders.
- Quote, Meet Life and Reading Cabinet.

### Wave 3 — Personal intelligence
- Journal/highlights anchors and search.
- Reading Passport/recap.
- Reading DNA explainability and recommendation improvements.

### Wave 4 — Advanced experience
- Contextual Book Expert.
- Goodreads import.
- Offline/PWA.

## PR discipline

- One coherent feature per PR; avoid giant feature bundles.
- First PR in a programme is audit/tests or contract, not sweeping UI+schema changes.
- Migrations include RLS, grants, indexes, constraints, rollback notes and tests.
- Use existing RPC authorization helpers and avoid SECURITY DEFINER footguns.
- Run typecheck, lint, targeted tests, full CI, build and mobile checks.
- Check accessibility, loading/empty/error states and analytics instrumentation.
- Provide screenshots/recording for visual changes and production verification steps.
- Merge only after review and green required checks.

## First recommended implementation

Start with a **Quotes Cloud Persistence** isolated PR: inspect quote schema and migration history, design safe account-specific migration/import, enforce owner RLS, add typed hooks, loading/error states, and test local-to-cloud merge, account isolation, duplicate prevention and feed publishing. This is bounded, high-value, and does not require replacing the social or reading architecture.
