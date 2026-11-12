# Phase 0 — Open-source Feature Adoption Audit (2026-11-12)

**Status:** Audit snapshot; no production data or schema changed.
**Repository:** `himanshugupta30062/Sahadhyayi` · default branch `main`
**Supabase project:** Sahadhyayi (`rknxtatvlzunatpyqxro`, ACTIVE_HEALTHY)
**Rule:** This report separates source-code evidence from deployed database evidence. A source file or migration in Git is not proof that a user-facing flow works in production.

## Executive result

- Sahadhyayi already has meaningful reading, journal, social, challenge, group, event, and AI foundations. Reuse them.
- The connected production database is active and has recent migrations through `fix_reading_group_notifications_schema_compatibility` (migration version `20261111173050`).
- Production has the Reading Groups Phase 1 foundation/lifecycle, membership/invite security, moderation, events, and notification/reminder/digest migrations recorded under deployed versions `20261111172347`–`20261111173050`.
- **The Phase 6 shared-reading-board and Phase 7 chapter-discussion migrations are not present in the current production migration history or live table inventory.** Their source/docs are not evidence of deployment. Do not enable or rely on those features in production yet.
- Quotes are not simply local-only: `QuotesContext.tsx` has local storage plus signed-in Supabase upsert/read merge. It is still local-first, sync errors are swallowed, and remove is not confirmed before UI state changes; robust cloud canonicality/conflict/retry needs work.
- Reading goals currently use localStorage and Supabase user metadata; Supabase update errors are caught/logged and do not roll back or expose a failed persistence state.
- Streaks are calculated from `detailed_reading_progress.updated_at`, not a dedicated immutable reading-activity/session event. A progress row's last update is not necessarily evidence of genuine reading on that day.
- Progress hook supports a `reading_progress` upsert keyed by `user_id,book_id`; the full reader lifecycle, cross-device resume, PDF/EPUB anchor semantics and race/offline behavior remain to be verified end-to-end.

## Repository / architecture baseline

From `package.json` on `main`:

- React 18 + TypeScript + Vite; Supabase JS; TanStack React Query.
- Vitest and `@vitest/coverage-v8`; ESLint; `npm run test:coverage`.
- Build includes sitemap generation, Vite, prerendering, server utilities, Cloudflare routing validation.
- Cloudflare deployment script; bundle limits: main app 240 KB, all client JS 760 KB.
- No local shell execution was performed through GitHub integration; this is a source/remote-state audit, not a locally executed build/test run.

## Feature inventory (initial confidence)

| Area | Source / production evidence | Assessment | Next verification |
|---|---|---|---|
| Reading progress | `useReadingProgress` reads `reading_progress`; save hook upserts by `user_id,book_id` | Foundation present; reader behavior not proven | PDF/EPUB resume, edition identity, lifecycle save, multi-tab/device |
| Reading goals | `useReadingGoal` reads metadata/localStorage; writes both and logs update failure | Persistence gap / false-success risk | Error state, server-authoritative readback, timezone/year rollover |
| Streaks | `useReadingStreak` reads `detailed_reading_progress.updated_at` | Proxy activity source | Define genuine session/activity events and timezone |
| Quotes | `saved_quotes` table exists with RLS; context local-first, cloud upsert/read merge | Partial cloud sync | retry/error/conflict/delete behavior, user isolation |
| Journal / margins / highlights / bookmarks | Existing hooks/components documented in roadmap | Present but anchors/exports/permissions unverified | source passage restore, RLS, private-data leak tests |
| Challenges / badges | `reading_challenges`, `user_challenges`, `reading_badges`, `user_reading_badges` exist | Avoid a second engine | idempotency and derivation correctness |
| Reading DNA | `reading_dna` table exists | Foundation present | consent, explainability, privacy, matching |
| Groups | `group_chats`, `group_chat_members`, messages, invitations, events and preferences exist | Phase 1–3/events/notifications deployed | membership, already-joined state, nonmember denial, event flows |
| Shared reading board | No Phase 6 migration in production history; no live `group_reading_books` table | Not production verified/deployed | apply missing migration chain to staging, validate, then controlled rollout |
| Chapter discussions | No Phase 7 migration or `group_reading_discussions` / comments tables in live inventory | Not production verified/deployed | dependent on Phase 6; staging spoiler/RPC tests |
| Group notification preferences | live preference/mute/reminder/digest tables and migrations exist | Database foundation deployed | verify UI controls and actual dispatch/logging |
| Feed / composer / moderation | Existing source/docs; production schemas include social features | Needs workflow audit | visibility RLS, block/mute/report, media retry, anonymous/nonfriend checks |
| Book Expert | Gemini/RAG functions and source integrations exist | Foundation present | citation/grounding, spoiler limits, authorized content, failure UX |
| Smart shelves / Goodreads import | Not established by current inspected files/tables | Candidate missing capability | design only after catalog metadata audit |

## Production migration / schema facts

### Reading Groups

Production migration records currently include:

- `20261111172347` — Phase 1 foundation
- `20261111172350` — Phase 1 lifecycle RPCs
- `20261111172353` — membership/invite hardening
- `20261111172356` — Phase 3 invites/moderation
- `20261111172359` — reading group events
- `20261111172404` onward — notification preferences, event notifications, mute fixes, reminders, digest, compatibility fix

The actual live schema includes `group_chat_members.status`, `group_events`, `group_event_participants`, `reading_group_notification_preferences`, `reading_group_notification_mutes`, `group_event_reminder_deliveries`, and `reading_group_digest_deliveries`.

Missing from the live migration inventory/table inventory at audit time:

- Phase 6 shared board migration / `group_reading_books` and related board tables/RPCs.
- Phase 7 `group_reading_discussions` and `group_reading_discussion_comments` plus its six scoped RPCs.

**Deployment gate:** never apply Phase 7 alone. Stage and reconcile the complete Phase 6 dependency first, then Phase 7, run RLS/RPC/spoiler tests and Supabase advisors, and only then enable UI.

### Supabase advisor snapshot (2026-11-12)

- Security advisor reports 6 RLS-enabled tables without policies (includes internal delivery/allowlist/permissions tables); inspect intended access and service-role usage before changes.
- Security advisor reports SECURITY DEFINER functions executable by anon/authenticated; each needs intent/authorization review (not blanket revocation, because some are deliberate public or authenticated RPCs).
- Auth warnings include OTP expiry above recommended one-hour threshold and leaked-password protection disabled.
- Performance advisor reports multiple permissive policies (28 findings) and one duplicate index on `stories`; triage by workload and intended policy semantics.
- Advisor output is a risk backlog, not permission to blindly change policies or drop indexes.

## P0/P1 audit exit checklist

- [x] Confirm repository and default branch.
- [x] Confirm connected Supabase project and health.
- [x] Inspect package scripts and dependencies.
- [x] Inspect progress, goal, streak, quote implementations.
- [x] Inspect live migration history and relevant live tables.
- [x] Inspect Supabase security/performance advisor output.
- [ ] Run CI/build/coverage from a checkout (not available in this connector-only audit).
- [ ] Browser E2E: reader resume (PDF/EPUB), mobile, cross-device, offline/failure.
- [ ] Group owner/member/nonmember/removed/banned/anon authorization matrix.
- [ ] Confirm Phase 6/7 migrations on staging; production rollout approval.
- [ ] Feed and journal privacy/visibility regression tests.

## Prioritized implementation decisions

1. **P0 — Reading core reliability:** reader lifecycle, honest save states, stable book/edition keys, cross-device and failure tests. Do not replace `reading_progress`.
2. **P0 — Reading Groups production-safe baseline:** verify existing Phase 1–3/events/notification UX; repair any regressions. Phase 6/7 remain gated by staging migration chain.
3. **P0 — Quote sync reliability:** retain `saved_quotes`; migrate local records safely; explicit sync errors/retry/delete confirmation; preserve timestamps and account isolation.
4. **P1 — Goals/streaks:** authoritative goal source and actual reading activity semantics; timezone/DST tests.
5. **P1 — Journal/highlights:** reuse current models; exact source anchors, export, private-by-default.
6. **P1 — Group voting/milestones:** only after group base and membership authorization is stable.
7. Continue Passport, smart shelves/import, quote social templates, contextual AI, offline mode in dependency order.

## Guardrails

- No production DDL or user-data mutations in Phase 0.
- No parallel/duplicate progress, quote, goal, challenge, event, or badge systems.
- Every PR isolated, additive, tested, mobile checked, and with rollback notes.
- Do not mark a feature complete based solely on a migration, branch, plan, or mocked test.
- Do not merge PRs or deploy migrations automatically.

## Next step

Phase 0 is complete as a **remote/source + live-schema audit snapshot**. Remaining checklist items require a checkout/browser test run and staging database validation. Begin the first implementation PR only after the baseline CI status and exact reader save/resume path are captured.
