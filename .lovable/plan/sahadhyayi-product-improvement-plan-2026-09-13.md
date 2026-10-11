# Sahadhyayi — verified product improvement plan

**Purpose:** Turn the existing Sahadhyayi application into a cohesive reading journey without replacing working features or inventing new ones.

**Planning rule:** This is a code-informed roadmap, not a claim that every listed behavior has been runtime-tested. Treat repository observations as verified, and mark untested behavior as an audit task. Confirm references before deleting or consolidating components.

## 1. Product direction

Sahadhyayi connects five parts of a reader's journey:

1. Discover books, authors, articles, and ideas.
2. Save a book and begin reading.
3. Reliably resume reading and track progress.
4. Discuss books and connect with readers, groups, and authors.
5. Reflect, publish, and return to the community.

Every authenticated page should help users continue one of these activities. Avoid adding new top-level destinations until the current journey is dependable.

## 2. Existing application map

The active route configuration in `src/App.tsx` includes the following routes. This is a route inventory, not proof that every feature works correctly.

| User journey | Current route(s) | Page/component in route configuration | Audit focus |
|---|---|---|---|
| Home / public entry | `/` | `Index` | Clear value proposition and paths into reading |
| Sign-in / account recovery | `/auth`, `/signup`, `/signin`, `/reset-password`, `/confirm-email` | `Auth`, `ResetPassword`, `ConfirmEmail` | Session transitions, validation, redirects, error states |
| Reader home | `/dashboard` | `Dashboard` | Accurate reading continuation, useful next actions |
| Library | `/library` | `Library` from `./pages/library` | Real catalogue data, search, filters, pagination |
| Discovery | `/discovery` | `Discovery` | Verify recommendations use real data and have useful explanations |
| Book detail / reader entry | `/book/:id` | `BookDetails` | Details, reading actions, progress, related community |
| Reader redirect | `/reader/:id` | `ReaderRedirect` redirects to `/book/:id?tab=read` | Preserve query parameters and restore the intended reader tab |
| Personal shelf | `/bookshelf` | `Bookshelf` | Shelf status, search, sort, progress consistency |
| Social feed | `/social` | `SocialMedia` | Posts, interactions, pagination, moderation and error states |
| Groups | `/groups`, `/groups/:id` | `ReadingGroups`, `GroupDetails` | Discover/join flow, shared group state, permissions |
| Reader map | `/map` | `Map` | Consent, location privacy, empty and permission-denied states |
| Profile | `/profile` | `Profile` | Editable profile, privacy, account actions |
| Authors | `/authors`, `/authors/:slug`, `/author/:slug` | `Authors`, `AuthorSlugPage`, `AuthorDetails` | Verify the two author detail route patterns and canonical linking |
| Publishing | `/publish`, `/my-publications` | `PublishBook`, `MyPublications` | Ownership, validation, drafts/statuses and error recovery |
| Articles | `/articles`, `/articles/:slug`, `/articles/write`, `/articles/edit/:id`, `/articles/my` | `Articles`, `ArticleDetail`, `ArticleWrite`, `MyArticles` | Draft preservation, public/private access, canonical article routes |
| Blog | `/blog`, `/blog/:slug` | `Blog`, `BlogPost` | Clarify how official editorial content differs from community articles |
| Games | `/games` | `Games` | Working game flows, progress and accessible feedback |
| AI book assistant | Shared deferred component | `BookExpert` in `src/components/book-expert/BookExpert` | Availability, contextual book handoff, API errors and mobile behavior |
| Help / legal / feedback | `/help-center`, `/feedback`, `/community-guidelines`, `/privacy-policy`, `/terms-of-service`, `/cookie-policy` | Corresponding page components | Clear support paths and current policy content |

### Authentication and routing findings

- `/dashboard`, `/profile`, `/publish`, `/my-publications`, `/articles/edit/:id`, and `/articles/my` are wrapped in `ProtectedRoute` in the inspected `src/App.tsx`.
- Other routes such as `/bookshelf`, `/social`, `/discovery`, `/groups`, `/map`, `/articles/write`, and `/publish`'s related public entry points must be audited for intended public/private behavior. Do not assume a page is secure just because its UI hides an action.
- `/authors/:slug` and `/author/:slug` both exist. Determine which is canonical, preserve old links with a redirect if needed, and avoid breaking shared URLs.
- `/reader/:id` redirects to the book detail route with a reader tab. Test deep links and query-string preservation.
- The app wraps routes in React Query, authentication, error-boundary, tooltip, and book-expert providers. Reuse these shared foundations unless an audit shows a concrete issue.
- The route-level loading fallbacks and lazy-loaded page chunks are already present; optimize them based on measured failures and performance, not by replacing the routing architecture wholesale.

## 3. Priority definitions

- **P0 — Correctness and trust:** a user can lose progress, see false data, access another user's content, or cannot complete a core journey.
- **P1 — Core product experience:** the feature exists but is hard to discover, fragmented, inconsistent, or unreliable.
- **P2 — Enhancements:** useful new capability after P0 reliability and P1 usability are addressed.

Priorities may change when the audit uncovers a confirmed security issue or a user-blocking defect.

## 4. Page-by-page improvement plan

### P0 — Dashboard: `src/pages/Dashboard.tsx`

**Goal:** Make Home the fastest way to resume reading or take one meaningful next step.

Tasks:
- Verify each widget's data source and loading behavior before changing the layout.
- Put Continue Reading first, with cover, title, saved position, total pages when known, progress percentage when computable, and a clear Resume action.
- Ensure the Resume action opens the correct book and reader tab.
- Show a small number of useful metrics only when computed from real user records.
- Connect quick actions to actual destinations: explore books, open shelf, discover a group, or create content.
- Show recommendations and community activity only when backed by real data; provide useful empty states for new accounts.
- Persist reading goals to the user's account if a supported profile/settings model exists; handle signed-out and sync-failure cases gracefully.
- Avoid making every widget equally prominent. Use one primary action and a small set of secondary actions.
- Verify keyboard navigation, mobile stacking, loading skeletons, error recovery, and dark-mode contrast.

**Acceptance criteria**
- A returning reader can resume their last book in one clear action.
- Dashboard progress matches the reader and bookshelf for the same book.
- No fabricated counts, placeholder activity, or misleading percentages are shown.
- A new user sees a clear first step rather than an empty dashboard.

### P0 — Book details and reader: `src/pages/BookDetails.tsx`

**Goal:** Make the book page the source of truth for book actions and reading continuation.

Tasks:
- Trace PDF/EPUB reader components, progress storage, book IDs, and cloud synchronization.
- Store progress against stable `user_id + book_id` identifiers, not book title.
- Confirm local progress and cloud progress have explicit precedence and conflict handling.
- Save progress at sensible intervals and on safe lifecycle transitions; avoid excessive writes.
- Restore the last saved position on reopen and on `/reader/:id` redirect.
- Display only metadata the source actually provides. Handle missing page count, cover, author, and unavailable reading sources.
- Keep read/resume, shelf status, rating/review, and relevant community actions easy to find.
- Reuse existing margin notes, spoiler-safe threads, reading rooms, or book-native community features only where they are already wired and stable.
- Add clear restricted-source, failed-load, retry, and alternate-source states.

**Acceptance criteria**
- A reader can open a book, advance, leave, and return to the last persisted position.
- Progress is not accidentally shared between two books with the same title.
- Repeated save/resume operations do not create duplicate progress records.
- Failures are visible and recoverable rather than silently losing progress.

### P0 — Bookshelf: `src/pages/Bookshelf.tsx`

**Goal:** Make the user's shelf dependable and easy to manage.

Tasks:
- Audit the existing status filters, search, summary metrics, and remove-book flow before extending them.
- Ensure all shelf mutations update the same source of truth used by Dashboard and Book Details.
- Add sorting only after confirming available fields: recently read, title, progress, or rating as applicable.
- Use semantic theme tokens instead of hardcoded light-only colors.
- Show progress only when the page count and saved position are valid.
- Provide empty states for each status, plus retry/error feedback for failed queries.
- Confirm removal behavior and any confirmation dialog are accessible.
- Preserve filters and sorting when returning from a book detail page where practical.

**Acceptance criteria**
- Saving, removing, or changing a book's status is reflected consistently across the app.
- Search and status filters work together.
- Unknown page counts never produce NaN, negative, or misleading progress.

### P0 — Authentication, access control, and account boundaries

**Scope:** `src/App.tsx`, `ProtectedRoute`, `AuthContext`, relevant data hooks and Supabase policies.

Tasks:
- Audit the intended visibility of every route listed in the route inventory.
- Check backend authorization and row-level security for every user-owned record; frontend route guards are not a substitute for backend permissions.
- Verify expired sessions, sign-out, password reset, email confirmation, and redirects to originally requested pages.
- Test that a user cannot read or mutate another user's private shelf, drafts, messages, or progress by changing an ID.
- Ensure protected actions have clear sign-in prompts and return users to the original destination after authentication where appropriate.
- Do not change security/session code without tests for the existing initialization flow.

**Acceptance criteria**
- Guest, member, content owner, and moderator/admin permissions are explicit and tested for relevant resources.
- Unauthorized reads and writes are denied server-side.
- Sign-out and expired-session behavior do not leave stale private data visible.

### P0 — Real data and state consistency

**Scope:** Dashboard, Library, Discovery, Bookshelf, Social, Groups, Profiles, Articles, Publications.

Tasks:
- Trace each page's actual query and mutation path before declaring a feature mocked or broken.
- Remove temporary/hardcoded records from production-facing experiences only after confirming they are not intentional demo or fallback content.
- Distinguish sample content from real user content if samples are intentionally retained.
- Standardize query invalidation and optimistic updates for likes, follows, joins, shelf saves, comments, and status changes.
- Provide rollback/error feedback when an optimistic update fails.
- Define which source is authoritative for reading progress, group membership, article publication status, and unread state.
- Avoid introducing new tables or duplicate state stores when an existing model can be repaired.

**Acceptance criteria**
- Refreshing the page preserves successful changes.
- Two pages that display the same entity show consistent data.
- Failed mutations do not leave the UI in a false success state.

### P1 — Library and Discovery: `/library`, `/discovery`

**Goal:** Help readers find a book they genuinely want to read.

Tasks:
- Decide and document the distinct role of Library versus Discovery; do not maintain duplicate search/filter logic without a clear purpose.
- Library should support catalogue exploration, search, filtering, sorting, and pagination using actual available data.
- Discovery should provide curated or personalized entry points only where the source and ranking logic exist.
- Remove ephemeral reviews or fake recommendation counts if confirmed in the implementation.
- Add recommendation reasons only when the underlying relationship can be explained truthfully.
- Deduplicate records from multiple book APIs using stable identifiers and carefully normalized metadata.
- Make missing covers, API limits, no results, and network failures understandable.
- Preserve query/filter state in shareable URLs if compatible with the current architecture.

**Acceptance criteria**
- Search returns results matching the visible query and filters.
- No-results states offer a useful way to broaden or reset the search.
- The UI does not label generic catalogue results as personalized recommendations.

### P1 — Social feed: `/social`

**Goal:** Make sharing ideas around reading easier than generic social scrolling.

Tasks:
- Audit current post, comment, like, repost, and pagination implementations.
- Make book attachment and author/group context easy to understand.
- Ensure post creation and edits preserve user input when a request fails.
- Add stable loading, empty, retry, and pagination states.
- Confirm moderation, mute, block, and report behavior across feed items and comments.
- Avoid repeated requests or duplicate feed items after navigation and refresh.
- Verify accessible labels, keyboard actions, and mobile composer behavior.

**Acceptance criteria**
- Successful actions remain after refresh and failed actions can be retried safely.
- Blocked or removed content is not reintroduced by another feed query.
- Feed interactions do not create duplicate posts or comments on retry.

### P1 — Reading groups: `/groups`, `/groups/:id`

**Goal:** Make it easy to find a relevant group and participate.

Tasks:
- Compare the route page, any Community groups view, and parallel group/chat components.
- Select one canonical implementation only after tracing all live references and features.
- Make group discovery, membership status, join/leave, details, and discussion links consistent.
- Clearly show the group's purpose, current book (if any), activity, and access rules.
- Verify membership permissions on every backend operation.
- Ensure chat and discussion states recover from loading failures and reconnects.
- Add report/block/mute controls to user-generated group content if not already enforced.

**Acceptance criteria**
- Join/leave state is consistent between list and detail pages.
- Non-members cannot access restricted group actions or content.
- Deep links to a group open the correct group.

### P1 — Reader map: `/map`

**Goal:** Support discovery without compromising privacy.

Tasks:
- Audit location source, consent, precision, and data retention.
- Only show users who have explicitly enabled map visibility.
- Use approximate location rather than exposing a home address or exact coordinates.
- Provide permission-denied, unavailable-map, loading, and empty states.
- Ensure map pins and list results obey block and privacy settings.
- Offer a list-based fallback for accessibility and small screens.

**Acceptance criteria**
- A user can opt out and their location is no longer shown to other users.
- The map never exposes a precise private location by default.
- Blocked users do not appear through map pins or nearby-reader lists.

### P1 — Profile: `/profile`

Tasks:
- Verify profile editing, avatar upload, reading interests, and save feedback.
- Separate public profile data from private account settings.
- Add favorite books or profile showcases only if the existing schema supports them or a deliberate schema change is approved.
- Show only real reading statistics.
- Replace external/legacy popups with native accessible dialogs where such flows still exist.
- Confirm account deletion and other destructive actions require appropriate confirmation and backend handling.

**Acceptance criteria**
- Saved profile changes persist and errors are recoverable.
- Public viewers cannot see private profile or reading data.
- Destructive actions cannot be triggered accidentally.

### P1 — Authors: `/authors`, `/authors/:slug`, `/author/:slug`

Tasks:
- Compare both detail route patterns and choose a canonical URL.
- Preserve legacy URLs with redirects if needed; do not break existing shared links.
- Ensure author cards link to the intended author and show only verified metadata.
- Connect authors to books and articles through stable relationships.
- Verify follow/unfollow state and any author events/messages that are actually implemented.
- Avoid placeholder analytics or unverified author metrics.

**Acceptance criteria**
- Each author has one canonical destination and valid deep links.
- Follow state remains consistent after refresh.
- Missing author records have a clear not-found state.

### P1 — Articles and publications: `/articles`, `/articles/write`, `/articles/edit/:id`, `/articles/my`, `/publish`, `/my-publications`

Tasks:
- Clarify the difference between community articles and book/publication submissions.
- Ensure a user's draft can only be edited by its owner or an authorized moderator.
- Preserve draft content on validation errors and network failure.
- Separate draft, published, and archived states only if these states are supported by the current data model.
- Show publication status and actionable validation messages.
- Record analytics only when events are actually captured.
- Verify public routes do not expose unpublished or private content.
- Audit whether `/articles/write` should be public or protected; implement the intended policy consistently in the UI and backend.

**Acceptance criteria**
- Create, edit, preview, and publish flows work end to end.
- Unpublished content is not exposed through public detail routes or search.
- A failed save does not discard the user's draft.

### P1 — Blog and editorial content: `/blog`, `/blog/:slug`

Tasks:
- Document how the official blog differs from community articles.
- Avoid duplicating the same content across separate discovery systems without clear labels.
- Ensure article detail routes handle missing slugs and stale links.
- Link to related books/authors only when the relationship exists.
- Keep public metadata, structured data, and canonical URLs consistent.

**Acceptance criteria**
- Readers can distinguish official editorial content from community-authored posts.
- Every published article has a valid canonical URL and a useful not-found state.

### P1 — Book Expert: shared deferred component

Tasks:
- Test availability on all relevant routes and on mobile.
- Preserve the book/page context when launched from a book detail or reader view, where supported.
- Handle missing API configuration, rate limits, timeouts, and empty responses.
- Keep the assistant from covering essential controls or losing user input when closed.
- Avoid presenting generated answers as quotations from a book unless the text is actually available and grounded.

**Acceptance criteria**
- Errors are understandable and recoverable.
- Opening/closing the assistant does not reset reading progress or block core navigation.
- Contextual answers clearly distinguish source text from explanation.

### P2 — Games: `/games`

Tasks:
- Inventory games and confirm which are complete and which are prototypes.
- Make score, answer feedback, keyboard controls, and restart behavior consistent.
- Persist progress only if the product intentionally supports it.
- Avoid fake leaderboards, scores, or badges.
- Keep games complementary to reading, not a competing primary journey.

### P1 — Notifications and messaging (where implemented)

Tasks:
- Locate actual notification/message components and their data sources before planning schema changes.
- Make unread counts, mark-as-read, and destination links consistent.
- Respect block, mute, group membership, and privacy settings.
- Handle duplicate events, stale counts, and failed updates.
- Do not invent a separate inbox or notification system if one already exists.

**Acceptance criteria**
- Opening a notification leads to the intended resource.
- Read/unread state persists and is consistent across relevant pages.
- Private messages and notification content obey server-side permissions.

### P0 — Shared application shell and UI quality

**Scope:** `src/App.tsx`, `Navigation`, shared UI components, route fallbacks.

Tasks:
- Test navigation destinations against the route inventory, including mobile menus.
- Retain the existing skip-to-content link, and verify it works with page headings and focus.
- Audit heading hierarchy, labels, focus visibility, contrast, and touch target sizes on critical routes.
- Ensure all lazy routes have stable loading and error recovery.
- Test the shared Book Expert overlay and footer so they do not obscure or disrupt authenticated workflows.
- Use design tokens for light/dark themes instead of one-off colors.
- Measure bundle and route loading before making further code-splitting changes.

**Acceptance criteria**
- Core pages work at narrow mobile widths and desktop sizes.
- Keyboard users can reach, understand, and operate every critical control.
- A single page-level failure does not crash the entire application shell.

## 5. Navigation and information architecture

The route structure currently has many distinct destinations. Do not immediately delete routes or rebuild navigation. First audit `src/components/Navigation` and usage analytics, then test this proposed grouping:

- **Home:** `/dashboard` for signed-in readers; public landing remains `/`.
- **Explore:** `/library`, `/discovery`, `/authors`.
- **My Reading:** `/bookshelf`, book detail/reader routes, reading goals if available.
- **Community:** `/social`, `/groups`, `/map`.
- **Read & Create:** `/articles`, `/blog`, `/games`, publishing routes as permitted.
- **Account:** `/profile`, settings, notifications, help.

This is a proposed information architecture, not an instruction to add duplicate pages. Keep existing URLs working; navigation labels and grouping can change independently from route paths.

## 6. Cross-cutting engineering work

### Data and backend
- Trace current Supabase tables, queries, edge functions, and row-level security before proposing schema changes.
- Document the source of truth for progress, shelves, follows, groups, posts, articles, and notifications.
- Validate authorization on the backend for all user-owned data.
- Normalize errors and expose user-friendly retry states.
- Avoid broad rewrites of auth/session initialization without regression coverage.

### Performance and reliability
- Measure slow routes, query waterfalls, large bundles, and image loading.
- Use React Query cache invalidation consistently after mutations.
- Add pagination or incremental loading to genuinely large lists.
- Avoid aggressive caching of private user-specific content across account changes.
- Verify that sign-out clears or invalidates private cached data.

### Accessibility and responsive design
- Audit keyboard navigation, accessible names, focus management, heading hierarchy, color contrast, and reduced motion.
- Test dashboard, library, reader, bookshelf, social, groups, profile, and writing flows on mobile.
- Use consistent semantic tokens for themes.
- Ensure maps and other visual-only experiences have accessible alternatives.

### Testing and deployment
- Add tests around existing architecture rather than replacing it.
- Required end-to-end journeys:
  1. Sign in → dashboard → resume book → leave → reopen → verify position.
  2. Search library → open book → add to shelf → change status → verify dashboard/shelf consistency.
  3. Create post → comment → refresh → verify persistence.
  4. Join group → open details → perform permitted action → verify membership.
  5. Create article draft → edit → save → verify privacy before publishing.
  6. Block/report user → verify behavior across all relevant surfaces.
  7. Sign out → verify private pages and cached private data are no longer available.
- Add build, lint, type-check, and critical test checks to the deployment workflow where available.
- Expand test coverage based on the actual tools already configured in the repository.

## 7. Implementation sequence

### Sprint 0 — Evidence and baseline
- Inventory live page components and their data dependencies.
- Identify duplicate implementations and determine actual runtime usage.
- Capture current build/test results and reproduce reported bugs.
- Record current critical-flow failures and performance baseline.

**Exit gate:** every P0 item has a reproduction or is explicitly marked unverified.

### Sprint 1 — Reading continuity
- Fix progress persistence and resume behavior.
- Align Dashboard, Book Details, and Bookshelf data.
- Add regression tests for same-title books and missing page counts.
- Verify session boundaries and access rules.

**Exit gate:** core reading journey passes end-to-end tests.

### Sprint 2 — Discovery and shelf
- Clarify Library vs Discovery responsibilities.
- Replace confirmed mock data with real data sources.
- Fix search/filter/pagination and empty/error states.
- Add tests for shelf mutations and recommendation labels.

**Exit gate:** users can find, save, and reopen books reliably.

### Sprint 3 — Community coherence and safety
- Consolidate duplicate group/feed/map paths only after reference checks.
- Make group and social state consistent.
- Enforce report/block/mute behavior across applicable surfaces.
- Add interaction and permission regression tests.

**Exit gate:** community journeys pass with member, non-member, and blocked-user scenarios.

### Sprint 4 — Profiles, creators, and editorial
- Improve profile privacy and author route consistency.
- Improve article/publication drafts, ownership, and status handling.
- Clarify Blog vs Articles.
- Test public versus unpublished content access.

**Exit gate:** content ownership and publication visibility are verified.

### Sprint 5 — Polish and optimize
- Accessibility fixes, responsive design, theme consistency, route performance.
- AI assistant and games reliability.
- Complete telemetry and product measurement after event definitions are validated.

**Exit gate:** no known P0 issues; critical flows and accessibility checks run in CI or documented release checks.

## 8. Product metrics

Instrument events only when event collection and privacy behavior are understood. Do not display these as existing metrics until validated.

- **Activation:** signup → first saved book → first reading session.
- **Reading reliability:** progress-save success, resume success, reader load failures.
- **Reading engagement:** active reading days, book starts, progress milestones, completions.
- **Discovery:** search success, book detail opens, shelf-save/start conversion.
- **Community:** group joins, meaningful comments/replies, room attendance, repeat participation.
- **Creator experience:** draft-save success, publish success, time to recover from errors.
- **Retention:** day 1, day 7, and week 4 return rates, segmented by first meaningful action.
- **Trust and quality:** report response time, block effectiveness, frontend errors, accessibility findings, and critical-flow test pass rate.

## 9. Scope guardrails

- Do not rewrite a page before tracing its current data path and shared dependencies.
- Do not delete duplicate components until references, route use, and unique behavior have been checked.
- Do not introduce fake metrics, temporary reviews, hardcoded user activity, or misleading personalized labels.
- Do not create new backend tables or parallel state stores without a documented reason.
- Do not expose exact user locations or private reading activity by default.
- Do not rely on frontend route guards alone for authorization.
- Do not treat a successful build as proof that the product flow works.
- Keep this plan updated as tasks are completed; label items **verified**, **in progress**, **blocked**, or **not started**.

## 10. First task for the coding agent

Start with the Dashboard → Book Details/Reader → Bookshelf reading-progress journey. Trace the actual implementation, identify the minimum files required, write tests for the expected behavior, implement only the smallest coherent fix, and report:
- files changed;
- root cause and evidence;
- tests run and results;
- remaining risks;
- any follow-up plan changes.

Do not begin broad refactors until this journey passes its acceptance criteria.
