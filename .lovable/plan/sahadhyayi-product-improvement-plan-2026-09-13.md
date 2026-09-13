# Sahadhyayi product improvement plan

## Product purpose
Sahadhyayi should be the digital home where readers discover books, continue reading, exchange ideas around specific books, and form lasting communities.

The primary product loop will be:

```text
Discover a book → Save or start reading → Track progress
        ↓                                      ↓
Find readers of that book ← Discuss notes, ideas, and chapters
        ↓
Join a group or room → Return for the next reading session
```

## What the current product already does well
- A real library, bookshelf, book details, PDF/EPUB reader, ratings, progress, goals, streaks, and recommendations exist.
- Social posts, comments, likes, reposts, groups, chats, friends, maps, Reading DNA, margin notes, spoiler-safe threads, and live reading rooms exist.
- Publishing, articles, authors, quizzes, search, SEO, analytics, moderation foundations, and route-level loading are present.
- The visual identity is recognizable, especially the dark home experience and warm reading surfaces.

## Main issues found
1. **The core journey is fragmented.** Library, Discovery, Bookshelf, Dashboard, Social, Groups, and Map compete instead of forming one reading journey.
2. **Some visible experiences are not connected to real data.** Discovery uses a small hardcoded catalogue and temporary reviews, while its links promise personalized recommendations.
3. **Reading continuity is unreliable.** PDF progress is not consistently saved or restored, and progress can be matched by book title instead of book ID.
4. **Community features are broad but disconnected.** Eight equal social tabs hide the strongest idea: readers connecting around the same book.
5. **Duplicate implementations create inconsistent behavior.** Groups, chat, maps, comments, book cards, library hooks, and unused pages have parallel versions.
6. **Safety controls are incomplete.** Blocking and reporting are not consistently applied to the live feed, comments, rooms, group chat, direct messages, and maps.
7. **The public experience has accessibility debt.** The live review found unlabeled controls, heading-order errors, and several low-contrast text combinations.
8. **Quality coverage is too small for the product size.** The main app has roughly 478 TypeScript files, 46 pages, 282 components, 79 hooks, and only three test files.
9. **The repository contains two frontend applications.** The active Vite product and an unfinished parallel application can drift and cause developers to fix the wrong implementation.

## Product structure
Reduce the top-level experience to four clear destinations:

- **Home** — continue reading, current goal, reader activity, and one recommended next action.
- **Explore** — all books, personalized recommendations, authors, and the reader's shelf.
- **Community** — activity feed, book hubs, groups, friends, and nearby readers.
- **Insights** — community articles, official editorial content, and writing tools.

Games, publishing, profile, settings, and notifications remain contextual actions rather than primary navigation items.

## Phase 1 — Restore trust in the core loop

### 1. Make reading progress dependable
- Store progress by `user_id + book_id`, not title.
- Save and restore PDF and EPUB position through one progress model.
- Record reader start, 25%, 50%, 75%, completion, and resume events.
- Add clear loading, restricted-source, alternate-source, and retry states.
- Move reader rendering and persistence out of the oversized reader component into focused modules.

**Success:** at least 90% of returning reader sessions resume from the last saved position; reader load failures stay below 1%.

### 2. Replace mock Discovery with real discovery
- Use the real library and recommendation sources for trending, curated, similar, and personalized books.
- Remove temporary guest reviews that disappear on refresh.
- Merge overlapping search/filter behavior with the main library search.
- Explain recommendations with labels such as “Because you saved…” or “Readers in your group enjoyed…”.
- Remove hardcoded library and reader counts from public screens.

**Success:** at least 15% of recommendation opens lead to a shelf save or reading start.

### 3. Establish one source of truth
- Select the active implementation for groups, group chat, maps, comments, book cards, library data, and reading progress.
- Remove unused mock and duplicate components after confirming no live references.
- Archive the unused parallel frontend so future work targets the production application only.
- Consolidate the duplicate progress tables or formally assign one responsibility to each.

**Success:** no user action produces different data depending on which page initiated it; remove at least 30% of duplicated library/social code.

### 4. Close immediate accessibility and stale-content gaps
- Fix unlabeled icon controls, heading order, keyboard focus, and failing color contrast.
- Replace raw interactive elements with the shared control system where appropriate.
- Remove obsolete 2024/2025 goal and event copy; calculate the current year dynamically.
- Replace “coming soon” sections with a working destination or remove them.

**Success:** no serious automated accessibility findings on Home, Explore, Book Details, Community, Groups, Articles, Auth, and Dashboard.

## Phase 2 — Build the book-centered community

### 5. Introduce a Book Hub
Every book page should become the center of its community:
- Read or continue reading.
- Save to shelf and update status.
- See readers currently reading it.
- View margin notes and spoiler-safe chapter discussions.
- Join or start a live reading room.
- Find groups reading the book.
- Share a post with the book already attached.

The existing Margin Notes, Threads, Rooms, and reader-connection features will be reused rather than rebuilt.

**Success:** increase the percentage of reading sessions followed by a meaningful community action.

### 6. Simplify Community
- Replace eight equal tabs with **For You**, **Books**, **Groups**, and **People**.
- Let Book Hubs contain rooms, margins, and spoiler threads in context.
- Make `/groups` and the Community groups view share one implementation and deep-linkable state.
- Consolidate maps into one nearby-reader experience with one privacy/consent flow.
- Add feed filters for friends, groups, and books being read, plus pagination.

**Success:** new users reach a relevant discussion or group within two interactions from Community.

### 7. Complete trust and safety
- Use one relationship model for friends, blocked users, and privacy filtering.
- Enforce blocks across feed, comments, direct messages, rooms, groups, search, and maps.
- Add report, mute, and block actions to every live user-generated surface.
- Give moderators one queue with evidence, status, action history, and appeal notes.
- Add basic spam limits for repeated posts, invitations, messages, and external links.

**Success:** every user-generated item is reportable; blocked users cannot reappear through another surface.

## Phase 3 — Personalization and retention

### 8. Purposeful onboarding
After signup:
1. Select favorite genres, languages, themes, and reading pace to seed Reading DNA.
2. Save three books.
3. Follow readers or authors with compatible interests.
4. Join one relevant group or room.
5. Land on Home with one clear next action.

The existing checklist becomes interactive and links directly to each unfinished step.

**Success:** track signup-to-first-book, signup-to-first-connection, and seven-day return rate.

### 9. A useful Home experience
- Prioritize “Continue reading” above statistics.
- Add activity from people, books, and groups the reader follows.
- Show one recommendation with a reason and one timely group/room invitation.
- Store reading goals in the account so they work across devices.
- Keep gamification optional and secondary to reading progress.

**Success:** improve want-to-read → reading conversion and weekly returning readers.

### 10. Connect Reading DNA to the whole product
- Use Reading DNA to rank recommendations, groups, rooms, authors, and reader matches.
- Show transparent match reasons, not only a percentage.
- Refresh the profile as reading behavior changes while allowing manual preference control.

**Success:** compare saves, joins, and conversations from personalized results against generic results.

## Phase 4 — Content, creators, and growth

### 11. Unify editorial content
- Present official blog content as a verified or featured category inside Insights.
- Keep one article discovery and detail system.
- Connect articles to referenced books, authors, groups, and discussions.
- Provide creator drafts, scheduling, moderation status, and audience analytics.

### 12. Search and discoverability
- Make global search accurately cover books, authors, articles, groups, and readers; its current copy promises more than its data source returns.
- Add typo tolerance, recent history, intent filters, and useful zero-result recovery.
- Preserve filter state in shareable URLs.
- Continue structured data and pre-rendering for public book, author, article, and group pages.

### 13. Mobile and low-bandwidth reliability
- Make reader, chat, posting, and search usable on weak connections.
- Cache essential shelf and progress state and communicate offline/pending sync clearly.
- Use optimized images consistently and remove dependency on untrusted placeholder hosts.

## Engineering foundation
- Add automated lint, tests, and production build checks before deployment.
- Add end-to-end tests for signup, search, shelf save, reader resume, post/comment/repost, group create/join/chat, and block/report.
- Add route-level recovery so one page failure does not remove the whole application shell.
- Expand accessibility checks across all pages and shared components.
- Keep one package/dependency workflow and one production frontend.
- Gradually replace loose data types around authentication, database rows, posts, comments, and reader progress.
- Use structured error reporting instead of scattered console output.
- Test row-level access rules for guest, member, owner, moderator, and admin roles.

## Recommended first implementation sprint
1. Fix PDF/EPUB progress persistence and resume by book ID.
2. Replace mock Discovery with real library recommendations.
3. Consolidate the duplicate Groups experience and remove mock groups.
4. Wire report/block/mute into posts, comments, group chat, rooms, and direct messages.
5. Fix the verified public-page accessibility failures and dynamic-year copy.
6. Add automated tests for those four user journeys before removing old implementations.

## Measurement dashboard
- **Activation:** signup → three saved books → first group or reader connection.
- **Reading:** book opened, progress saved, resume success, completion rate.
- **Connection:** meaningful comments, replies, group participation, and room attendance per active reader.
- **Discovery:** search success, recommendation click-through, and save/start conversion.
- **Retention:** day 1, day 7, and week 4 return rates after first reading/community action.
- **Trust:** report volume, response time, repeat abuse, and block effectiveness.
- **Quality:** reader failure rate, frontend errors, accessibility failures, and tested critical journeys.

## Scope guardrails
- Do not add more top-level features until the core discover → read → discuss → connect loop is reliable.
- Reuse existing book-native features instead of creating more parallel social tools.
- Remove fabricated statistics, fake community activity, and temporary data from production-facing pages.
- Ship each phase as complete user journeys with measurement and tests, not isolated screens.
