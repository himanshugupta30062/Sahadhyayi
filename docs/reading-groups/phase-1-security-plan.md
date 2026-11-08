# Reading Groups Phase 1 — Security-first implementation plan

**Status:** Planning baseline (review before schema/code rollout)  
**Scope:** Reading Groups foundation only. Shared books, progress, discussions, events and discovery enhancements are subsequent phases.

## 1. Existing implementation (repository inspection)

Current frontend:
- `src/components/groups/ReadingGroupsDirectory.tsx`: directory, create/edit/delete, join/leave, invite-link copying.
- `src/pages/GroupDetails.tsx`: details, member display, chat entry and join/leave.
- `src/hooks/useGroupManagement.ts`: group CRUD and membership mutations.
- `src/hooks/useGroupMessaging.ts` / `src/components/groups/GroupMessaging.tsx`: members, message queries, sending and realtime.

Canonical data tables: `public.group_chats`, `public.group_chat_members`, `public.group_messages`. Avoid creating parallel group/chat/member tables.

Observed behavior and risks:
1. `group_chats.is_encrypted` is used by UI as an invite-only/private marker. Encryption state must never define visibility or join authorization.
2. Invite URLs embed a group UUID (`?join=<group-id>`); this is a shareable deep link, not an invitation credential, and cannot be individually revoked/expired.
3. `useCreateGroup` performs group insert and creator-admin membership insert as two client operations and compensates with a delete on failure. This is not atomic.
4. `useJoinGroup` directly inserts a member row with role `member`; membership/join policy should be decided and enforced server-side.
5. `useAddGroupMember` accepts a target user ID from the client and inserts membership without a visible client-side authorization check; rely on strict database authorization, and remove/replace this path if unused.
6. `useUpdateGroup` and `useDeleteGroup` rely on RLS to decide whether caller can update/delete.
7. Group directory query is authenticated-only today; group details has a guest path. This inconsistency should be resolved explicitly rather than widening access accidentally.
8. Historical migrations include group-membership RLS recursion fixes and later policy optimization. Changes must be additive/reconciled against the current effective policies, not blindly recreate policies.

These observations identify risky patterns and authorization dependencies; they are not a claim that every path is presently exploitable.

## 2. Product/security model (decisions)

Keep three separate axes:

- **Visibility:** `public`, `private`, `unlisted`
  - public: discoverable and safe metadata visible to everyone; posts/messages and member details remain member-only unless explicitly designed otherwise.
  - private: metadata and membership are not enumerable by non-members; join requires invitation or approved request.
  - unlisted: not directory-discoverable; direct URL may show a deliberately minimal preview; membership requires invitation/approval.
- **Join policy:** `open`, `approval`, `invite_only`. It is independent of visibility. Invalid combinations should be rejected or normalized (private groups cannot be open-join).
- **Membership state:** `pending`, `active`, `banned`; role is separate: `owner`, `admin`, `moderator`, `member`.

Legacy `is_encrypted` is retained and interpreted only as encryption capability/state. Do not silently migrate it into privacy semantics. Backfill legacy groups explicitly with a documented mapping and preserve existing member access.

## 3. Threat model and invariants

Protect against:
- anonymous/authenticated non-members enumerating private group metadata, member identities, messages or invite records;
- arbitrary users self-assigning admin/owner or adding arbitrary users;
- invite-token guessing, replay, expiry bypass, revocation bypass and overuse races;
- creator/admin removing the final owner or orphaning a group;
- unauthorized edits/deletes, membership status changes and role escalation;
- UUID/slug substitution and IDOR in every group-scoped query/RPC;
- SQL recursion, SECURITY DEFINER search-path attacks, accidental broad grants;
- stale client caches/realtime subscriptions exposing data after membership changes;
- service-role credentials or privileged operations leaking into browser code.

Core invariants:
1. Authenticated identity is derived from `auth.uid()`, never accepted as a trusted client parameter.
2. No client may directly set privileged role/status fields.
3. Group creation + owner membership are one transaction.
4. Invite redemption is atomic, bounded, expiring, revocable and idempotency-aware.
5. Only active members can read group messages; pending/banned/non-members cannot.
6. A group always has at least one active owner; ownership transfer is explicit and atomic.
7. Every SECURITY DEFINER function has a fixed safe `search_path`, least-privilege execute grants and explicit authorization checks.
8. Private-group discovery/count endpoints never reveal existence or member counts to unauthorized users.
9. RLS is the final enforcement layer; frontend checks are UX only.

## 4. Database design

### `group_chats` additions (migration, additive)
- `visibility text NOT NULL DEFAULT 'public'` CHECK in public/private/unlisted
- `join_policy text NOT NULL DEFAULT 'open'` CHECK in open/approval/invite_only
- `slug text` (optional; unique only where present; never an authorization secret)
- `category text`, `language_code text`, `rules text`
- `archived_at timestamptz` (archive before destructive delete)
- `updated_at` maintained by trigger if no existing reliable trigger

Preserve existing columns, IDs, timestamps and `is_encrypted`. Verify current constraints and column types before applying.

### `group_chat_members` additions/constraints
- `status text NOT NULL DEFAULT 'active'` CHECK in pending/active/banned
- `joined_at`/existing timestamp retained; add `updated_at` only if useful
- unique constraint on (`group_id,user_id`) to prevent duplicate memberships
- role CHECK allows owner/admin/moderator/member; backfill legacy admin/member safely
- indexes on (`user_id,status`), (`group_id,status`), (`group_id,role,status`)

Do not store pending requests as active membership. Pending rows must not pass message/member authorization.

### `group_invitations` (new)
- `id uuid primary key`, `group_id uuid FK`, `inviter_id uuid`
- `token_hash text UNIQUE NOT NULL` (raw bearer token shown once; never persisted/logged)
- `expires_at timestamptz`, `max_uses integer`, `uses_count integer NOT NULL DEFAULT 0`
- `revoked_at timestamptz`, `created_at timestamptz`
- optional `invitee_email_hash` only if invite-to-email is implemented; do not store unnecessary PII
- check max_uses positive/null and uses_count nonnegative/<= max_uses where applicable
- indexes on group_id, expiry and token_hash

Raw tokens should be cryptographically random (>= 256 bits), hash with a server-side cryptographic function, compare hashes in a narrow RPC, and never be placed in analytics/logging. Redeem in a transaction with row locking to prevent concurrent use-count races.

## 5. Authorization matrix

| Action | Owner | Admin | Moderator | Member | Non-member |
|---|---:|---:|---:|---:|
| View public group metadata | yes | yes | yes | yes |
| View private/unlisted metadata | yes | yes | yes | no (except minimal valid invite preview) |
| Read messages/member roster | yes | yes | yes | no |
| Edit core settings | yes | yes | no | no |
| Manage members / approve requests | yes | yes | limited moderation | no |
| Assign admin/owner | owner only | no | no | no |
| Create/revoke invites | yes | yes (policy-limited) | optional | no |
| Delete/archive group | owner | no | no | no |
| Leave group | yes, if another owner remains / transfer first | yes | yes | yes |

All permissions must be encoded in RLS/RPC and tested against actual Postgres roles.

## 6. Server-side operations (RPCs)

Prefer narrowly scoped, transactional RPCs:
- `create_reading_group(name, description, visibility, join_policy, ...)`: validate inputs; insert group and owner membership atomically; return safe group projection.
- `request_or_join_reading_group(group_id)`: determine policy; open join creates active member; approval creates pending; invite-only rejects without valid invite.
- `redeem_group_invitation(raw_token)`: hash, lock invitation row, validate expiry/revocation/capacity/group state, join or request, increment uses atomically.
- `change_group_member_role(group_id,user_id,new_role)`: only owner can promote/demote admins or transfer ownership; prohibit client assignment of owner.
- `moderate_group_member(...)`: scoped admin/moderator checks, no self/last-owner removal.
- `leave_reading_group(group_id)`: block last-owner exit; protect system/default group by stable ID/flag, not mutable display name.
- `archive/delete_reading_group(group_id)`: owner-only and explicit lifecycle.

Functions use SECURITY DEFINER only when necessary, `SET search_path = ''`, fully qualified objects, revoke PUBLIC/anon execution and grant authenticated only. Do not expose service-role key to clients.

## 7. RLS policy strategy

First snapshot effective `pg_policies`, grants, constraints and function definitions in the target Supabase project. Then write migration policies explicitly:
- `group_chats SELECT`: public metadata OR active member OR creator/owner; private/unlisted hidden from non-members.
- `group_chats INSERT`: only via create RPC (or a tightly constrained insert policy if atomic RPC unavailable).
- `group_chats UPDATE`: owner/admin only; WITH CHECK must prevent ownership/visibility escalation.
- `group_chats DELETE`: owner only; prefer archive RPC.
- `group_chat_members SELECT`: self membership and active group members/authorized moderators; no broad roster for private groups.
- `group_chat_members INSERT/UPDATE`: disallow direct role/status writes; only RPC paths.
- `group_chat_members DELETE`: self-leave or authorized moderation; last-owner invariant enforced transactionally.
- `group_messages SELECT/INSERT/UPDATE/DELETE`: active membership required; sender identity tied to auth.uid(); edit/delete sender or moderator rules.

Avoid policies that recursively query the same RLS-protected membership table. Use a proven non-recursive helper with fixed search_path if necessary, or carefully structured policy predicates. Do not use service-role bypass in client paths.

## 8. Frontend/API changes

- Replace UUID invite links with opaque token routes; maintain legacy group-ID links only as non-authorizing group previews/redirects.
- Create form: visibility and join policy choices, validation, rules; explain public metadata vs member-only chat.
- Directory: only public groups; private groups appear only in user's memberships; unlisted never in directory.
- Group page: safe metadata preview; gated member/chat controls; pending request and banned states.
- Settings: owner/admin management; role/member management; invite list/revoke; archive/delete confirmation; transfer ownership.
- Join UI reflects open/approval/invite-only and does not claim joined before server success.
- Remove/replace unsafe `useAddGroupMember`; do not optimistically expose member content.
- Query cache invalidation on membership/role/visibility changes; unsubscribe realtime and clear group-specific cache after leave/ban.
- Keep `is_encrypted` UI only for genuine encryption capability.

## 9. Migration rollout / PR sequence

**PR 1 — Documentation & baseline** (this document): threat model, policy matrix, migration sequence and acceptance criteria.

**PR 2 — Schema and safe RPC foundations:** additive columns/constraints/indexes; atomic create; server-side join; role guardrails; invitation table and redeem/revoke RPC. Keep old UI compatible while migrating data.

**PR 3 — RLS hardening and security regression tests:** policies reconciled with effective current policies; no recursive membership checks; validate direct table mutations and all access combinations.

**PR 4 — Frontend integration:** group creation/privacy controls, pending membership UX, token invitation manager, secure join/leave, settings/roles.

**PR 5 — Security QA and cleanup:** remove legacy ID-as-invite behavior, unsafe hook paths, stale caches/realtime, migration/backfill checks, audit logs and release checklist.

Keep PRs narrow and reviewable. Do not merge a migration that could lock out current members until backfill and policy tests pass in staging.

## 10. Acceptance / test matrix

Automated database tests (prefer pgTAP or existing SQL test convention) and application tests must cover:
- anon cannot enumerate private/unlisted groups, members, messages or invitations;
- authenticated non-member cannot read private group/member/message data;
- public metadata is visible but public chat/member roster is not;
- active member reads; pending and banned members denied;
- non-owner cannot change roles, group settings, archive/delete or mint/revoke invites;
- user cannot insert self as admin/owner or add another user directly;
- owner transfer and last-owner protections under concurrent requests;
- create group failure rolls back group + owner membership together;
- expired/revoked/exhausted invite rejected; invite use count race-safe; invalid token leaks no group details;
- open/approval/invite-only join behavior correct;
- duplicate membership prevented;
- default group protection uses immutable identifier/flag, not name;
- group message sender must be auth.uid();
- RLS helper function has safe search_path and least-privilege grants;
- browser: signed-out preview, login redirect, mobile creation/settings, invite copy/redeem, leave/ban cache cleanup.

Release gates: migration applies cleanly to a production-like copy; no unexpected RLS policy overlap/recursion; lint/typecheck/build pass; targeted tests pass; no secrets or service-role usage in browser; CI and Supabase advisors reviewed.

## 11. Operational safeguards

- Back up schema/data and capture existing group/membership counts before migration.
- Run migration in staging first; verify legacy group membership and creator admin mapping.
- Monitor RPC failures, unauthorized attempts and invitation abuse (without recording raw tokens).
- Rollback should be additive/forward-fix; avoid dropping legacy columns until a later cleanup window.
- Do not merge/deploy automatically just because a PR is created; require green checks and review of migration/RLS diff.
