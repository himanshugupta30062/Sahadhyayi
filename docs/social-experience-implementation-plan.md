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

## Status in the follow-graph and feed phase
- Existing feed reliability work from PR #664 provides surfaced query errors, stable 25-post cursor pagination, retry states and regression coverage.
- The `public.user_follows` graph has a composite key, no-self-follow constraint, follower lookup index, RLS, participant-only relationship reads and authenticated self-only follow/unfollow writes.
- `useUserFollows` and `useToggleUserFollow` provide one-way follows independently of mutual friendship requests. Friends & Connections includes a Following list.
- Post audiences are defined by `20261020130000_add_post_audiences.sql`: `public`, `followers`, `friends` and `private`. Existing posts default to `friends`; the posts SELECT RLS policy remains the final visibility boundary for every feed.
- The social feed now offers **For You / Following / Latest**. For You includes the reader's own posts plus two explainable discovery signals: authors the reader follows and book IDs on the reader's own `user_bookshelf` (currently reading, completed or want-to-read). It combines those signals in one query, applies stable cursor pagination, and relies on posts RLS to remove anything the viewer is not allowed to see.
- Following filters to authors the reader follows; Latest is the chronological set of posts visible under RLS. The former client-side Trending sort was removed because it only reordered the loaded page and did not represent a reliable feed-wide ranking.
- An empty For You feed now prompts the reader to add books or follow readers. Empty Latest is a genuine empty state; it no longer inserts sample reader cards into the authenticated feed.
- Still to implement: saved posts/Reading Cabinet, robust reporting/block/mute flows, public follower/following counts, expanded profile discovery, messaging consolidation and production moderation tooling.
- Deployment remains dependent on applying all existing social schema migrations (including post audiences and follow graph) through the normal Supabase migration process. Do not deploy UI that expects a schema addition before its migration is applied.
- Validation: review CI build, lint, tests and authorization checks before merging; do not treat a feature as production-ready based only on a successful preview deployment.

## Product and UX evolution (2026-10)

A detailed design/backlog lives in [`docs/social-media-product-and-ux-blueprint.md`](./social-media-product-and-ux-blueprint.md). This extends the existing plan rather than replacing its reliability-first delivery order.

Priority:
1. Finish feed, friends/search, and audience/RLS correctness before adding new social surfaces.
2. Simplify the UI to Home / Discover / Create / Inbox / Profile, with For You / Following / Latest as the feed modes. Keep Reading Rooms, Marginalia, Spoiler Threads and Reading DNA as contextual book-first tools.
3. Build **Quote, Meet Life** as Sahadhyayi's signature feature: a quote tied to a real book/source, an optional reflection about a person or situation, an attribution-aware designed card, and a canonical share link. Person tagging must be opt-in; private context must never leak to link previews.
4. Improve photo posting with correct image ratios, carousel support, full-screen viewing, alt text, upload progress/retry, compression, and private storage that matches post audience.
5. Add private Reading Cabinet collections, interpretation threads on a shared quote, book gifting, reading moments and later reading recaps after moderation/privacy foundations are complete.

Acceptance requires passing CI and authorization tests, realistic mobile validation, and a clear successful-empty/error distinction. Do not seed fake engagement or weaken row-level security for a better-looking feed.
