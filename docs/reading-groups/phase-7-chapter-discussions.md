# Reading Groups Phase 7 — Chapter Discussions

**Status:** Implemented on `feat/reading-groups-phase7-chapter-discussions`; CI and review pending.

## Member experience

Active reading-group members get a **Chapter discussions** section on the group detail page. Discussions are linked to a title already on the group's shared reading list and support four topic types:

- Discussion
- Question
- Reflection
- Quote

A topic can be marked as general or associated with a chapter. The author can also set the chapter level that contains spoilers. The title and discussion metadata remain visible, so titles must be spoiler-free; protected body text is returned as `NULL` until the reader's completed-chapter progress reaches the selected spoiler chapter.

Replies have their own spoiler chapter setting. A reader who has not unlocked the parent discussion cannot reply to it. The reply list requires both the parent discussion and the individual reply spoiler thresholds to be unlocked (the author can still see their own content).

Discussion authors can remove their own topics and replies. Active group owners, admins, and moderators can remove content for moderation.

## Data model

Migration: `20261108170000_reading_groups_phase7_chapter_discussions.sql`

- `group_reading_discussions`: group, shared reading-book entry, chapter context, topic type, spoiler level, title, body and author.
- `group_reading_discussion_comments`: replies with per-reply spoiler levels.

The discussion foreign key targets `group_reading_books`, not an arbitrary book id, so a discussion is always tied to a title on that group's shared reading list.

The spoiler cutoff uses the reader's completed chapters in `detailed_reading_progress` for the same `books_library` id. A chapter counts as completed only when `completion_percentage >= 100`. Page progress from the Phase 6 shared board is not treated as proof of chapter completion.

## Database security

Both tables have RLS enabled and direct table privileges revoked from `PUBLIC`, `anon`, and `authenticated`. Client operations use six scoped RPCs:

| RPC | Access |
|---|---|
| `list_group_reading_discussions` | Active group member; returns safe body text only |
| `create_group_reading_discussion` | Active group member; book must belong to the group |
| `list_group_reading_discussion_comments` | Active group member; returns per-reply safe body text |
| `create_group_reading_discussion_comment` | Active member who has unlocked the parent topic |
| `delete_group_reading_discussion` | Topic author or active group owner/admin/moderator |
| `delete_group_reading_discussion_comment` | Reply author or active group owner/admin/moderator |

Each function checks `auth.uid()`, verifies active membership, pins `search_path = ''`, and has execute privileges revoked from `PUBLIC` and `anon` before granting to `authenticated`. No client-supplied user id is trusted for author identity.

## Frontend integration

- `src/components/groups/GroupReadingDiscussions.tsx`: topic composer, spoiler-aware discussion cards, replies and author/moderator deletion controls.
- `src/hooks/useGroupReadingDiscussions.ts`: typed React Query RPC integration and targeted invalidation.
- `src/pages/GroupDetails.tsx`: renders discussions for active members only.
- `src/integrations/supabase/types.ts`: adds all six RPC signatures.

## Production migration dependency

The connected production Supabase project was inspected on 8 November 2026. Its latest recorded migration is `20261107222954` (`add_news_image_attribution_fields`). It has not recorded the November 8 Reading Groups Phase 1–6 migrations, and the live `group_chat_members` table currently lacks the newer `status` column.

**Do not apply this Phase 7 migration by itself to production.** First reconcile and apply the pending Phase 1–6 migration chain in order, verify the live schema and RPCs, then apply Phase 7. The Supabase Preview check was skipped/failed in the related Phase 6 PR, so the successful Cloudflare preview does not prove the database schema is deployed.

## Validation checklist

- [ ] Apply Phase 1–6 migrations in order on a staging database.
- [ ] Apply this migration on staging and run Supabase security/performance advisors.
- [ ] Verify anonymous and non-member calls fail for all six RPCs.
- [ ] Verify active members see titles and safe bodies, but not protected body text before completing the spoiler chapter.
- [ ] Verify the topic author can see their own body and a completed reader can unlock it.
- [ ] Verify each reply has an independent spoiler threshold.
- [ ] Verify a member who leaves or is banned loses access to lists, topics and replies.
- [ ] Verify only the topic/reply author or an active moderator can delete.
- [ ] Run the hook/component/RLS regression tests, typecheck, production build, browser startup smoke test and bundle-size checks.
- [ ] Confirm the live Supabase migration history and schema before enabling in production.
