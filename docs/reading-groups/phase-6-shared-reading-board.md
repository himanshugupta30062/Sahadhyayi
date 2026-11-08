# Reading Groups Phase 6 — Shared Reading Board

**Status:** Implemented on branch `feat/reading-groups-phase6-shared-reading-board` (PR validation pending).

## Member experience

Active group members see a shared reading board on the group detail page. The board has four stages:

- **Current read:** the group's selected title.
- **Up next:** a moderated queue of books.
- **Finished together:** books the group has completed.
- **Archived:** books retained in the group's history but no longer active.

Group owners, admins, and moderators can add an existing `books_library` title, start a queued title, mark the current title complete, return a completed/archived title to the queue, and remove a title. A database partial unique index enforces at most one current title per group, including concurrent moderator actions.

## Personal progress and privacy

Each active member can save their current page for a shared title. Progress is **private by default**. Members must explicitly enable “Share my page and progress with this group” before their progress contributes to group aggregates.

The list RPC returns the caller's own page and share preference, plus only aggregated counts and average completion for opted-in readers. It does not return other members' individual page numbers or identities. Turning sharing off removes the member from the group aggregate while preserving their own saved progress.

## Database boundary

Migration: `20261108160000_reading_groups_phase6_shared_reading_board.sql`

New tables:

- `group_reading_books`: canonical group reading queue, with a foreign key to the existing `books_library` catalog.
- `group_reading_progress`: per-member progress and explicit sharing preference.

Direct table privileges are revoked from public, anonymous, and authenticated clients. The client uses these RPCs only:

| RPC | Permission |
|---|---|
| `list_reading_group_books` | Active group member |
| `add_reading_group_book` | Active owner/admin/moderator |
| `set_reading_group_book_status` | Active owner/admin/moderator |
| `remove_reading_group_book` | Active owner/admin/moderator |
| `save_reading_group_progress` | Active group member; caller identity always comes from `auth.uid()` |

Every function is `SECURITY DEFINER` with an empty fixed `search_path`, least-privilege execute grants, and group-membership authorization derived from the authenticated caller. The two update/removal functions check target existence and moderator authorization in the same locked query to avoid exposing hidden record existence.

## Frontend integration

- `src/components/groups/GroupReadingBoard.tsx`: responsive board, book selector, queue controls, opt-in progress UI.
- `src/hooks/useGroupReadingBoard.ts`: typed React Query RPC integration and cache invalidation.
- `src/pages/GroupDetails.tsx`: board is rendered only for active members.
- `src/integrations/supabase/types.ts`: generated function signatures updated.

## Validation checklist

- [ ] Apply migration to a staging Supabase project and validate the RPCs with anon, non-member, pending, banned, member, moderator, and owner sessions.
- [ ] Verify direct SELECT/INSERT/UPDATE/DELETE on both new tables fails for authenticated clients.
- [ ] Verify private progress is visible only to its owner and shared aggregates exclude opt-out rows.
- [ ] Verify two concurrent attempts to set different titles as current cannot violate the one-current invariant.
- [ ] Run targeted Vitest tests, typecheck, production build, and CI bundle-size checks.
- [ ] Confirm Cloudflare preview and Supabase schema before enabling in production.

The migration is additive and must be applied through the repository's normal Supabase deployment workflow. A green frontend build alone does not prove the production database has been migrated.
