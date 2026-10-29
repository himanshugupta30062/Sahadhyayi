# SECURITY DEFINER RPC audit — 2026-10-29

## Scope and safety boundary

This audit uses a read-only permission/function-definition inspection of the production Supabase project `rknxtatvlzunatpyqxro` plus repository call-site searches. It does not apply migrations, change live grants, or modify production data.

The immediate grant fix is in migration `20261029210000_restrict_trigger_function_execute.sql`: five trigger-only routines are removed from API-role execution while their triggers remain intact.

## Anonymous-executable SECURITY DEFINER functions reviewed

| Function | Intended exposure | Review notes |
| --- | --- | --- |
| `get_article_author_follower_count(uuid)` | Public aggregate | Returns a count only; explicitly granted to `anon` and `authenticated`. |
| `get_article_like_count(uuid)` | Public aggregate for published content | Definition returns a count only when the article is published or owned by the caller. |
| `get_author_follower_count(uuid)` | Public aggregate | Returns follower count, not the follower list. |
| `get_authors_data()` | Public author directory | Returns author-directory fields; call site should treat returned author data as public directory content. |
| `get_authors_with_books()` | Public verified/authentic author directory | Filters to authentic authors with at least one book. |
| `get_book_feedback_vote_summary(uuid[])` | Public book-feedback aggregate | Returns grouped vote totals and whether the current viewer voted, not voter IDs. It is used by book idea/readers UI. Keep the feedback-type and book-only filters; verify the product's publication/visibility semantics before tightening it. |
| `get_game_leaderboard(integer)` | Public game leaderboard | Bounded to at most 100 rows. It includes username, full name and profile photo, so this remains a privacy-sensitive product decision: align fields with public-profile/leaderboard consent before expanding the output. |
| `get_public_group_member_counts()` | Aggregate-only group metadata | Returns group IDs and member counts for non-encrypted groups; the current `group_chats` schema has no explicit `is_public` column, so do not invent a visibility predicate without a schema/product migration. |
| `get_total_users_count()` | Public aggregate | Returns only a total count. |
| `increment_article_views(uuid)` | Public write-side counter | Updates only a published article and returns no row data; abuse/rate limiting is a separate consideration. |

These functions are not interchangeable: public directory/counter RPCs are intentionally exposed, while user-specific and admin RPCs should remain authenticated and enforce identity/role checks in their bodies. Do not revoke all authenticated execution globally; the application depends on several authenticated, user-scoped RPCs.

## Other findings

- The five trigger-only SECURITY DEFINER routines are now covered by the PR migration and a regression test. PostgreSQL triggers continue to invoke their functions; clients do not need direct RPC execution.
- `public.owner_test_analytics` has RLS enabled and no policies. The inspected table grants were limited to database owner/service role, and the ingestion Edge Function writes using its privileged client. This is consistent with a server-only telemetry table; **do not add a permissive policy**.
- Three missing foreign-key indexes and 108 advisor-reported unused indexes require workload/query-plan review. No indexes were added or dropped based only on an advisor snapshot.
- Admin analytics RPCs such as `get_admin_recent_actions`, `get_admin_recent_visits`, and `get_admin_website_analytics` already deny anonymous execution and check admin authorization. Keep their current narrow access.

## Remaining validation

1. Review the leaderboard's public display fields against profile privacy expectations and the public group count contract against the product's group visibility model.
2. Run the full repository test, coverage, build, and SonarCloud checks on the PR.
3. After PR review and CI success, apply the migration through the normal migration process and verify effective grants/triggers in production.
