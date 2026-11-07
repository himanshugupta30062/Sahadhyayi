# Sahadhyayi — Reader-First Feature Implementation Roadmap

**Status:** Proposed implementation plan  
**Scope:** Complete the reader journey end to end while preserving existing working features.  
**Planning principle:** Extend the current product; do not create parallel versions of features or duplicate sources of truth.

## Executive direction

Sahadhyayi should help a reader discover a book, decide to read it, read comfortably, remember meaningful passages, understand their own reading habits, and connect with people who care about the same books.

The repository already contains substantial foundations. This roadmap therefore separates:
- **Existing foundation:** functionality/components already present in the codebase.
- **Completion work:** behavior that needs an implementation audit, integration, or reliability improvements.
- **Net-new work:** capabilities not currently evidenced in the inspected code.

A route or component is not proof of a working end-to-end feature. Every phase has acceptance tests before it is considered complete.

## 1. Existing foundations to reuse

| Capability | Evidence in the current codebase | Roadmap treatment |
|---|---|---|
| Reading and progress | `BookReader`, `useReadingProgress`, `useSaveReadingProgress`, `useChapterProgress`, local progress storage | Harden resume, synchronization, and failure recovery |
| Reader bookmarks | `reader_bookmarks` migration and `useReaderBookmarks` | Reuse; improve bookmark UX and reader anchors |
| Notes and margins | `margin_notes`, private/friends/public visibility, `useMarginNotes`, `ReaderMarginDrawer` | Reuse for journal entries and shared annotations |
| Goals and streaks | `useReadingGoal`, `useReadingStreak`, dashboard goal/streak components | Unify persistence and calculate from verified activity |
| Reading challenges | `useReadingChallenges`, Activity page, challenge/badge migrations | Connect to goals and reading activity; avoid another challenge system |
| Reading statistics | Dashboard stats, weekly summary, streak and book-level reader stats | Distinguish personal stats from community/book stats; verify sources |
| Quotes | Quotes page/context, quote-post migration and shareable quote cards | Make collection durable, attributable, and book-linked |
| Recommendations | `useBookRecommendations`, recommendations Edge Function | Improve ranking and add honest recommendation explanations |
| AI book assistant | Book Expert, Gemini/RAG Edge Functions | Add book/page context and spoiler-aware answers |
| Readers with similar tastes | Reading DNA, `matchScore`, `DnaCompare` | Extend matching with transparent explanations and privacy controls |
| Shared reading | Reading rooms, room chat, reading groups, group schedules/events foundations | Evolve existing rooms/groups; do not create duplicate clubs |
| Reviews and discussion | Book reviews, social feed, spoiler threads, margin notes | Connect book pages to the right discussion surfaces |
| Reader identity | Profiles, profile stats, badges, favorite books and Reading DNA | Build a shareable Reading Passport from verified data |

## 2. Product outcomes

1. A reader can reliably open a book, make progress, leave, and resume on the same or another device.
2. A reader can save a passage, bookmark a location, and write a private reflection without accidentally publishing it.
3. Reading goals, streaks, statistics, and recaps are calculated from real persisted activity.
4. Readers can find books and other readers with clear explanations for recommendations.
5. Friends and groups can read together with useful shared context, without exposing private reading activity.
6. The core reading experience remains usable on mobile and with intermittent connectivity.
7. Existing user data, routes, and permissions remain intact during rollout.

## 3. Phased implementation

### Phase 0 — Baseline audit and data contracts

**Goal:** Confirm what works before changing the database or user experience.

Work:
- Map the full reader flow: Library/Discovery → Book Details → Reader → progress save → Bookshelf/Dashboard.
- Trace stable book identifiers across reading progress, bookmarks, margin notes, shelf entries, quotes, and recommendations.
- Verify the current PDF and EPUB reader implementations, source licensing, storage locations, and mobile controls.
- Audit whether quotes are persisted to the authenticated user's account or only held in client state.
- Audit goal persistence: the current goal hook uses local storage and user metadata; decide and document one authoritative persisted value.
- Distinguish personal statistics from book/community reader counts.
- Inspect existing RLS policies and storage permissions for every user-owned record.
- Capture baseline tests, build/lint/typecheck results, and known reader defects.

**Deliverables:** Feature inventory marked verified/incomplete/missing; data-flow diagram; regression-test checklist; no schema changes unless a confirmed defect requires one.

**Exit gate:** Each existing foundation above has an owner path, source of truth, permission model, and a reproducible test or is explicitly recorded as incomplete.

### Phase 1 — Reliable reading core (P0)

**Goal:** Make reading and resuming dependable before adding engagement layers.

Work:
- Make progress consistently keyed by authenticated user and stable book ID; never use title as identity.
- Define page/position semantics for PDF and EPUB separately and handle unknown total pages safely.
- Save progress at controlled intervals and safe reader lifecycle points; prevent duplicate or excessive writes.
- Resolve local-versus-cloud progress conflicts deterministically and show sync status when relevant.
- Ensure reader redirects/deep links restore the requested book, tab, and page/position.
- Align Book Details, Dashboard, and Bookshelf after every progress/status update.
- Persist reader preferences such as theme, font size, and line spacing per user/device as appropriate.
- Improve reader mobile controls, touch targets, error/retry states, and accessibility.
- Keep the current Book Expert and community margin controls from obscuring reader controls.

**Acceptance tests:**
- Open → advance → close → reopen restores the correct position.
- The same title represented by different book IDs never shares progress.
- Offline or failed saves do not falsely report success or discard the latest local position.
- A successful shelf/status update is reflected on Dashboard and Book Details after refresh.
- PDF and EPUB resume behavior is tested independently.

### Phase 2 — Personal journal, highlights, and quote collection (P1)

**Goal:** Let readers remember what mattered in a book.

Work:
- Build a **Reading Journal** view organized by book and date, using existing private margin notes where the model supports the required content.
- Extend the margin-note experience to capture reflection, selected passage, page/location, and visibility.
- Add persistent **Highlights** with reliable anchors: EPUB CFI/locator where supported; PDF page plus text/position metadata where available.
- Support edit/delete, search/filter by book, and export of a user's own notes.
- Make visibility explicit at creation time: private by default; sharing must be an intentional action.
- Upgrade the Quotes collection to persist to the user's account, attach book/author/page/source where known, organize collections/tags, and share a quote card.
- Reuse the existing quote-post format for public sharing; never publish private journal content automatically.
- Provide deletion/export behavior for user-generated reading data.

**Data rule:** Reuse `margin_notes`, `reader_bookmarks`, and the existing quote/post model where appropriate. Add a dedicated highlight table only after confirming no existing structure can safely represent stable passage anchors. All new user data must have owner-scoped RLS and tests.

**Acceptance tests:**
- A note or highlight survives refresh and sign-in on another device.
- A highlight reopens the correct book and location.
- Private notes never appear in public feeds, maps, profiles, or recommendations.
- A user can edit/delete their own content; another user cannot access it by changing an ID.
- Quotes retain their source attribution and do not imply copyrighted text ownership.

### Phase 3 — Reading timeline, analytics, goals, and Passport (P1)

**Goal:** Make a reader's progress visible and meaningful.

Work:
- Establish a trustworthy reading-activity record from real reader sessions/progress changes. Reuse existing event data only if it captures the required timestamps, book identity, and user ownership.
- Track useful events such as session start/end, pages/locations advanced, book started, book completed, goal milestone, and challenge completion. Avoid recording every keystroke or unnecessary sensitive activity.
- Build a **Reading Timeline** with books started/completed, milestones, and selected journal highlights.
- Build personal statistics: books completed, active reading days, reading time and pages only when actually measurable, genres/authors explored, and goal progress.
- Repair goal persistence so the same goal is displayed across devices and components.
- Derive streaks and weekly/monthly summaries from the agreed activity source, using the user's timezone.
- Create a **Reading Passport** on the profile: favorite genres/authors, completed books, reading interests, selected badges, and optional public showcases.
- Add a shareable **weekly/monthly/yearly Reading Recap** with privacy controls and no fabricated numbers.
- Let readers choose which reading statistics and books are public.

**Acceptance tests:**
- Personal statistics match the underlying user-owned records.
- Unknown page counts or missing session duration are omitted, not guessed.
- Timezone boundaries do not create incorrect streaks.
- Private books/notes are never included in a public Passport or recap.
- Goal changes persist across devices and do not corrupt historical totals.

### Phase 4 — Better discovery and reader matching (P1)

**Goal:** Help readers find the next book and people with compatible interests.

Work:
- Improve the existing recommendation Edge Function using weighted signals from completed/current/want-to-read books, ratings, genres, authors, saved quotes/topics, and opted-in group activity.
- Exclude books already on a user's shelf where appropriate and avoid recommending unavailable or restricted content as readable.
- Add clear **Why this book?** explanations; label generic trending results as trending, not personalized.
- Add similar books/authors and "readers who liked this also liked" only when supported by real data and minimum privacy thresholds.
- Extend existing Reading DNA matches with transparent overlap reasons, opt-in visibility, and block/mute exclusions.
- Offer a **Find readers with similar taste** experience based on shared books, genres, and declared interests—not exact location.
- Improve catalogue filters for language, genre, author, availability, format, and length only where metadata is present.
- Provide useful new-reader states when there is not enough history to personalize.

**Acceptance tests:**
- Recommendation reasons can be traced to actual signals.
- A new user receives useful non-personalized discovery without a false personalization claim.
- Users can opt out of matching and hide private reading activity.
- Blocked users do not appear in matching results.
- Search filters and recommendation lists do not produce duplicate or inaccessible items.

### Phase 5 — Read Together: rooms, groups, and schedules (P1)

**Goal:** Turn existing community features into a coherent shared-reading experience.

Work:
- Improve current Reading Rooms with optional shared book/page or chapter context, room goals, session status, and lightweight participation prompts.
- Add an optional synchronized reading position only when all participants explicitly opt in; never expose a member's private position by default.
- Add book-club schedules to existing Reading Groups: selected book, weekly chapters, meeting date/time/timezone, facilitator, and discussion prompts.
- Connect group schedules to existing Events/Activity infrastructure rather than creating a separate calendar.
- Add spoiler-safe chapter discussions and mark the covered chapter/section.
- Make join/leave, invitation, membership, moderation, and notifications consistent across group and room surfaces.
- Add reader meetups and author sessions through existing event flows where appropriate.

**Acceptance tests:**
- Room and group membership state remains correct after refresh.
- A participant can hide their reading position and activity.
- Spoiler labels and chapter context are visible before opening a discussion.
- Non-members cannot access restricted group content.
- Timezones and recurring meeting dates render correctly.

### Phase 6 — Offline reading and resilient sync (P2, after Phase 1)

**Goal:** Support reading in weak-connectivity conditions without breaking licensing or security.

Work:
- Audit whether the app is installable and whether a service worker/PWA setup already exists.
- Add an installable app shell and offline status indicator.
- Use IndexedDB for an explicit download queue and locally stored reader state where browser support allows.
- Offer offline downloads only for content whose licence and delivery mechanism permit local storage. Do not cache arbitrary third-party or restricted PDF/EPUB URLs.
- Queue progress, bookmarks, and permitted journal mutations locally while offline.
- Sync on reconnect with idempotency keys, conflict handling, retry/backoff, and visible failure states.
- Provide storage usage, remove-download, and clear-local-data controls.
- Keep auth tokens, service-role credentials, and private server data out of offline caches.

**Acceptance tests:**
- A user can open an explicitly downloaded eligible book with the network disabled.
- Offline progress syncs once, without duplicates, after reconnect.
- Conflicts are resolved predictably and the user is not shown a false synced state.
- Restricted or externally hosted content is not cached without permission.
- Removing a download actually clears the local copy.

### Phase 7 — Book Expert contextual companion (P1)

**Goal:** Make the existing Book Expert useful inside the act of reading.

Work:
- Pass book ID, title, current page/chapter, and selected text only when the user explicitly invokes the assistant.
- Offer explain-this-passage, vocabulary, context, chapter recap, and reader questions.
- Make spoiler boundaries explicit: current chapter, prior chapters, or whole-book spoilers.
- Ground answers in book text that the platform is authorized to process; otherwise clearly label general knowledge and do not invent quotations.
- Link answers back to the relevant page/section when possible.
- Preserve the reading position and unsent question when the panel is opened/closed.
- Add rate-limit, timeout, unavailable-source, and safe retry states.

**Acceptance tests:**
- The assistant receives the correct book/page context.
- It does not reveal later-chapter spoilers when the reader selected a restricted spoiler mode.
- It distinguishes sourced text from generated explanation.
- Opening or closing it does not reset reading state.

### Phase 8 — Quality, privacy, and launch readiness (required across all phases)

Work:
- Add unit/integration tests for every new hook, component, migration, RLS policy, and Edge Function.
- Add end-to-end tests for the primary reader journeys, mobile viewport, expired session, two-account isolation, and offline reconnect.
- Add telemetry for activation, reader load/resume/save success, highlight creation, recommendation clicks, room participation, and goal milestones. Collect only what is necessary and explain privacy behavior.
- Verify keyboard navigation, screen reader names, focus order, contrast, reduced motion, and mobile touch targets.
- Test loading, empty, no-network, permission-denied, stale-data, and retry states.
- Monitor error rates and sync failures after release; use feature flags/gradual rollout for risky changes.

## 4. Delivery order and release gates

| Release | Scope | Gate before moving on |
|---|---|---|
| R0 — Baseline | Phase 0 audit and data contracts | Existing feature status and data ownership documented |
| R1 — Read reliably | Phase 1 | Resume/progress/shelf regression tests pass |
| R2 — Remember reading | Phase 2 | Private notes/highlights/quotes persist and pass RLS tests |
| R3 — Understand progress | Phase 3 | Stats, timeline, goals, and Passport match real records |
| R4 — Discover better | Phase 4 | Recommendation explanations and privacy controls verified |
| R5 — Read together | Phase 5 | Group/room permissions, spoiler safety, and schedules pass |
| R6 — Read anywhere | Phase 6 | Licensed offline content and sync conflict tests pass |
| R7 — Contextual AI | Phase 7 | Grounding, context, and spoiler tests pass |
| Continuous | Phase 8 | CI and release checks pass for each phase |

## 5. Definition of done

A feature is done only when:
- It is connected to the correct existing route and navigation.
- Its data source and ownership are documented.
- Backend RLS and storage permissions are tested.
- Loading, empty, error, retry, and signed-out states are handled.
- Desktop and mobile behavior are verified.
- Unit/integration tests and applicable end-to-end tests pass.
- Analytics are truthful and privacy-aware.
- Existing functionality and user data remain backward compatible.

## 6. Explicit non-goals and safeguards

- Do not create a second journal, quote collection, reading-group, challenge, or recommendation system when an existing model can be extended.
- Do not expose private books, page positions, notes, highlights, or reading activity by default.
- Do not use exact geolocation as a default reader-matching signal.
- Do not claim a book is available offline unless it is licensed and fully downloaded.
- Do not invent pages read, reading time, reviews, ratings, popularity, or personalized recommendation reasons.
- Do not treat a successful build as proof that a reader journey works.
- Do not make destructive schema/data changes without migration tests, rollback planning, and production backup checks.

## 7. First implementation batch

Start with **R0 + R1**:
1. Audit the live reader and progress pipeline, including PDF/EPUB and mobile behavior.
2. Add missing tests around save/resume, same-title books, local/cloud conflicts, and cross-page cache consistency.
3. Fix confirmed P0 defects without changing unrelated UI.
4. Publish a concise verification report with files changed, tests run, unresolved risks, and exact production steps (if any).

Only after R1 passes should highlight/journal schema changes or offline caching begin. This sequencing protects reader data and prevents building new features on top of unreliable progress.
