# Sahadhyayi Social Experience — Implementation Plan

## Goal
Make Sahadhyayi feel like a polished, dependable book-centred social network, taking interaction patterns from Instagram, community patterns from Facebook, and reading identity/discovery from Goodreads. Preserve the existing green/gold brand and working reading features.

## Scope and guardrails
- Keep `public.posts` as the canonical post source until all references and data have been audited.
- Do not silently merge or delete legacy `social_posts`, `user_profile`, friendship, or chat models.
- Never weaken row-level security to make a feed appear populated.
- Keep follows (one-way) conceptually distinct from mutual friendships.
- Do not fabricate user activity or expose private profile/location/message data.
- Every user-facing feed filter must map to a real, tested query and visibility rule.

## Phase 0 — reliability (start here)
1. **Error truthfulness:** failed feed requests must remain errors, not become an empty array. Show an explicit error/retry state and reserve the empty state for successful zero-row results.
2. **Visibility contract:** define public, friends-only, and private post audiences only after confirming existing columns/migrations and legacy clients. Implement matching RLS policies with owner/friend/non-friend/anonymous test cases.
3. **Feed semantics:** define For You (eligible public posts plus followed-reader posts), Following (follow graph), and Latest (chronological eligible public posts). Keep private/friends-only items out of public queries.
4. **Pagination:** replace fixed 50-row feed with cursor pagination ordered by `created_at DESC, id DESC`; add a suitable composite index only after reviewing current indexes/query plans.
5. **Interaction integrity:** verify post creation, likes, comments/replies, reposts, deletes and counters persist after reload and are idempotent under double taps.
6. **Observability:** log request failures with useful context without exposing private content or tokens; add retry and loading states.

### Acceptance criteria
- A database outage/permission failure produces a visible error and retry action, never “No posts yet.”
- Successful empty query shows the empty state.
- Feed pages do not repeat or skip records at equal timestamps.
- Anonymous, non-friend, friend and owner roles see only posts permitted by the audience rules.
- Likes/comments/reposts persist and counts remain consistent after reload.

## Phase 1 — core social loop
- One-way follow/unfollow, clear follow state, reader suggestions and public reader profiles.
- Feed composer for text, photo, book-linked posts, quotes and reading-progress updates.
- Likes, nested comments/replies, reposts, saves and share links with optimistic UI plus rollback on failure.
- Notifications for follows, likes, replies, mentions and friend requests; unread state belongs to the recipient.
- Search should return real readers/books/groups, with debounced queries and a useful no-results state.

## Phase 2 — reading-first discovery
- Profile sections for currently reading, favourite genres, shelves, reviews and milestones.
- Recommendations using explainable signals: shared books, genres, follows and group membership.
- Book activity pages with discussions and reading updates.
- New-user onboarding that invites interest selection, adding a book, following readers and joining a club.

## Phase 3 — make existing reading features social
- Reading rooms: truthful live/upcoming state, participant count and clear join/create actions.
- Margin notes: book-linked quotations/reflections and appropriate spoiler controls.
- Spoiler-safe threads: book/chapter-aware visibility.
- Reading DNA: explainable reader matches based on consented interests/activity.
- Groups: book-of-the-month, buddy reads, reading goals and scheduled events.

## Phase 4 — safety, performance and quality
- Audit SECURITY DEFINER functions; retain anonymous execution only where intentionally public and safe.
- Add/report/block/mute flows and moderation review tools.
- Audit private messaging RLS and mutual-consent location sharing.
- Optimize images, query indexes and mobile loading states.
- Add integration tests for authorization, interactions and empty/error/loading states.

## UX direction
- Feed-first home with For You / Following / Latest.
- Mobile bottom navigation: Home, Discover, Create, Inbox, Profile.
- Desktop navigation: Home, Discover, Groups, Inbox, Profile; notifications in the header.
- Preserve Sahadhyayi's forest-green, warm-neutral and gold identity; prioritize readable posts, book covers, and uncluttered actions.
- Keep Reading Rooms, Margin Notes, Spoiler Threads and Reading DNA accessible under a cohesive reading-community area rather than competing as primary navigation.

## Success metrics
Instrument baselines before setting targets:
- onboarding completion and time to first follow/group join;
- percentage of posts receiving an interaction within 24 hours;
- day-1/day-7 return rate;
- feed success rate and p95 latency;
- failed mutations, reports and blocks.
Do not optimize vanity metrics or seed fake engagement.

## Suggested delivery sequence
1. Feed error handling and regression tests.
2. RLS/visibility audit and tested feed semantics.
3. Cursor pagination and query/index verification.
4. Follow/profile/discovery polish.
5. Book-centric content and group/reading-room integration.
6. Safety, accessibility, performance and product analytics.

## Status in this PR
- Implemented: feed query failures propagate to React Query's error state rather than being converted to an empty feed; plain-query fallback errors are surfaced.
- Implemented: stable `created_at DESC, id DESC` ordering and 25-post cursor pages with a “Load older posts” control, loading feedback, and a retryable error state.
- Implemented: regression tests cover the visible feed error/retry state and the older-post control.
- Implemented: the reader suggestion action now says “Add friend” because it sends a mutual friend request; it no longer incorrectly implies a one-way follow.
- Added: this staged plan and acceptance criteria.
- Not yet implemented: a true one-way follow graph, feed-mode semantics based on follows, audience schema/RLS changes, private/friends-only visibility, broader discovery redesign, messaging consolidation, and production moderation workflows. These require focused schema/policy review and tests before safe rollout.
- Validation: source changes have been committed to the feature branch. Build, lint, and Vitest results still need to be verified; do not treat this PR as production-ready until checks pass.
