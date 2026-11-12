# Sahadhyayi Authentication & Security Audit (2026-11-12)

Scope: repository source inspection only. This is not a live penetration test or a Supabase production-configuration audit. No production settings, credentials, user data, or destructive operations were accessed.

## Confirmed observations

### 1. Supabase Auth is used for sessions (positive)
- `src/integrations/supabase/client.ts` configures Supabase Auth with PKCE, persistent sessions, automatic refresh, and URL session detection.
- The client embeds the Supabase project URL and a publishable/anon key. These are browser-public credentials by design; never put service-role or secret keys here.
- Browser storage is localStorage on normal site origins. This is standard for a browser SPA but means a successful same-origin XSS can steal/abuse the stored session. Treat XSS prevention as an auth-critical control.

### 2. Edge Function caller verification helper exists (positive, verify adoption)
- `supabase/functions/_shared/auth.ts` checks Bearer header and calls `supabase.auth.getUser()` before accepting a user.
- It returns CORS `Access-Control-Allow-Origin: *`. Wildcard CORS is not authentication; endpoints must still authorize every request. Prefer an explicit allowlist for browser-facing functions where feasible.
- Audit every function to ensure protected handlers call this helper and enforce resource ownership/roles—not merely authenticate.

### 3. Admin route is server-backed (positive, frontend alone is not authority)
- `src/components/AdminRoute.tsx` calls `verifyAdminStatus` and denies non-admin users in the UI.
- This is only a navigation guard. Every admin RPC, table, storage bucket, and Edge Function must independently enforce admin authorization with RLS/server-side role checks.

### 4. OAuth temporary state/token check exists (partial positive)
- Search located temporary OAuth token matching in `server.js`. Validate complete state generation, expiry, single-use behavior, session binding, and callback handling in a dedicated review.

### 5. Password reset screen checks session (partial positive)
- `src/pages/ResetPassword.tsx` checks Supabase recovery/session state before showing the password update flow. This client guard must be backed by Supabase's single-use, expiring recovery tokens and Auth configuration.

## Not verified (must not be called secure until checked)

- Supabase Auth production rate limits, email OTP expiry/length, email confirmation, CAPTCHA enforcement, SMTP configuration, leaked-password protection, MFA and session lifetime.
- OTP/token values in actual HTTP responses or logs.
- Email enumeration behavior across signup, login, recovery and resend.
- RLS enabled/policies for all tables, views, RPCs, storage objects and Realtime publication tables; SECURITY DEFINER functions and grants.
- Admin role source of truth, privilege escalation through client-controlled metadata, and every admin API.
- Refresh-token reuse/session revocation and password-reset/email-change session invalidation.
- OAuth state entropy, expiry, one-time use and CSRF protections.
- Production secrets, GitHub Actions permissions/secrets, dependency vulnerabilities, CSP and XSS.
- Live exploitability or any breach/user-data exposure.

## Remediation priorities

### P0 — immediately verify/fix
1. Run Supabase Security Advisor and inspect all RLS-disabled tables and SECURITY DEFINER functions/grants.
2. Confirm no service-role/secret keys or passwords are present in frontend bundles, repository history, CI logs or issue artifacts; rotate any exposed secret.
3. Ensure every privileged Edge Function/RPC checks authenticated identity, role and object ownership on the server/database.
4. Ensure admin role is sourced from trusted DB/app metadata and never accepted from client input.
5. Keep production email confirmation enabled; CAPTCHA fail-closed on public auth endpoints.

### P1 — auth hardening
6. Configure OTP/link expiry <= 3600 seconds (prefer shorter where UX permits), adequate OTP length, and production SMTP.
7. Confirm Supabase Auth endpoint rate limits and test safe 429 behavior; avoid custom client-only throttles as the sole protection.
8. Use generic user-facing responses where account enumeration is possible, while preserving safe internal telemetry.
9. Audit XSS sinks/dependencies/CSP because SPA session storage is accessible to same-origin JavaScript.
10. Verify OAuth state is random, bound to the initiating session, expiring and single-use.
11. Verify logout, password reset and email changes revoke/re-authenticate sessions according to expected policy.

### P2 — resilience/monitoring
12. Enable/retain Auth audit logs; alert on abnormal sign-in, recovery, admin and privilege changes.
13. Require MFA for platform administrators and protect GitHub/Supabase owner accounts with MFA.
14. Add regression tests for unauthenticated, non-owner, non-admin and expired-token cases across all sensitive endpoints.

## Safe validation plan
- Use a dedicated staging project and test accounts only.
- Run negative authorization tests (anonymous, user A accessing user B, ordinary user accessing admin routes).
- Do not brute-force real accounts, enumerate production users, or test reset links belonging to real users.
- Read production settings only; require explicit approval before changing them.


## Live database review (2026-11-12 continuation)

### Confirmed hardening applied
- Dropped `public.group_chat_members` policy `Group creators can add members`, which allowed self-insertion and creator insertions without requiring role=`member` or group privacy constraints.
- Preserved the narrower policies: authenticated self-join to non-encrypted groups as `member`; admin/creator adds with role checks enforced by policy context.
- Verified remaining INSERT policies after the change.
- Matching migration: `supabase/migrations/20261112150000_harden_group_chat_members_insert_policy.sql`.

### Six RLS-enabled tables with no policies: exposure review
These tables have no client table privileges for `anon` or `authenticated`; grants are limited to `postgres` and `service_role`. Thus RLS policy absence does not currently expose them through normal PostgREST client roles:
- `group_event_reminder_deliveries`
- `group_invitations` (contains invitation token hashes; table comment confirms hashes, not raw tokens)
- `owner_test_analytics` (contains IP/user/event metadata; service-role only)
- `owner_test_ip_allowlist` (service-role only)
- `reading_group_digest_deliveries`
- `role_permissions` (read/write via guarded admin RPCs; service-role only direct table grants)

### Anonymous SECURITY DEFINER review
Ten anon-executable SECURITY DEFINER functions were sampled. They expose public aggregates/counts or mutate only published article view counters; no direct secret/token return was identified in this sample. These functions still require abuse controls (rate limits, bounds) and routine review. Examples: public author data, follower/like counts, public group member counts, leaderboard, total profile count, published article views.

### Production Auth configuration warnings (still outstanding)
Security Advisor reports: anonymous sign-ins enabled, OTP long expiry, leaked-password protection disabled. These are project Auth settings, not safely changeable through the database migration; must be adjusted in Supabase Auth dashboard/API with staged validation and explicit confirmation.


### SECURITY DEFINER review — privileged RPCs and user data (continued)

- Reviewed administrator RPCs: `admin_set_user_role`, `admin_set_role_permission`, `admin_list_user_roles`, `admin_list_role_permissions`, `get_admin_recent_actions`, `get_admin_recent_visits`, and `get_admin_website_analytics`. All sampled functions check `public.is_admin()` (or authentication plus admin) before returning sensitive data or changing roles/permissions. Role and permission values are allowlisted. No admin escalation was identified in this sample.
- `public.is_admin()` checks the caller's `auth.uid()` against `public.user_roles`; no client-supplied role is trusted.
- Reviewed group/friend/invitation RPCs: `are_friends` only returns true to a participant; `get_friend_profile_info` limits non-friend profile lookup and gates location; `get_friend_locations` requires both location-sharing and consent; `create_reading_group_invitation` requires active owner/admin/moderator and stores SHA-256 token hash; `redeem_reading_group_invitation` authenticates, validates expiry/revocation/usage, locks invitation, and inserts the redeemer as member; `moderate_reading_group_member` and `set_reading_group_member_role` check group moderator/owner permissions and protect owner role.
- `user_chapter_progress` ignores the supplied user UUID and scopes results to `auth.uid()`; `is_group_member` similarly requires requested user to equal caller.
- Catalog check: all public-schema SECURITY DEFINER functions reviewed have a configured `search_path`; no unset search_path was found.
- These are targeted source/definition reviews, not exhaustive review of all ~70 functions or adversarial testing. Continue with remaining write RPCs, storage policies, Edge Function authorization, and test coverage.

### Advisor findings remaining
- SECURITY DEFINER execute warnings (60 authenticated / 10 anon functions) are not themselves proof of a vulnerability. Maintain per-function grants and authorization review; do not blanket revoke because public functions and triggers have legitimate use.
- Keep outstanding Auth dashboard controls (anonymous sign-in decision, OTP expiry, leaked-password protection) tracked separately from database migrations.


### Storage and Edge Function review (2026-11-12)

#### Storage policy observations
- `book-pdf-quarantine` and `research-paper-quarantine` are private buckets. Book PDF quarantine upload is constrained to the caller's UID folder and `source.pdf`; read is caller-folder only. Research quarantine read is submitter-folder or admin; uploads/deletes are caller-folder scoped.
- `book-pdfs`, `books`, `audio-summaries`, and `news-covers` are configured public. Public SELECT policies align with intended public assets. Catalog PDF/news cover writes are admin/editor permission-gated; audio summary upload policy is admin-only.
- `books` has a public SELECT policy for the `user-uploads` prefix and users can upload/update/delete under their own UID folder. This makes those uploaded objects publicly readable (bucket is public). Confirm that this is intentional for all user-uploaded content; if user uploads can contain private manuscripts or personal files, split them into a private bucket and remove public reads. No policy change made because current product use/compatibility is not yet established.

#### Edge Function inventory and checks
- Supabase reports 26 active functions; most have platform `verify_jwt=false`, so handler-level authentication/authorization must be explicit. `delete-account`, `enrich-authors`, and `submit-research-paper` have `verify_jwt=true`.
- `delete-account`: independently verifies access token with `auth.getUser(token)`, requires explicit DELETE confirmation, and derives target user ID from verified identity (not request body). No IDOR found in reviewed path.
- `verify-book-pdf`: despite `verify_jwt=false`, validates bearer token via `auth.getUser(token)`; restricts submission to submitter or DB admin, checks rights attestation and state transitions before scanning.
- `review-book-pdf`: validates caller JWT and explicitly checks admin role from `user_roles` before preview/review/publish actions. Signed preview URL TTL is 180 seconds.
- `submit-research-paper`: `verify_jwt=true` plus `auth.getUser()`; checks file path UID prefix and storage existence for publish submissions. Continue reviewing DB constraints/duplicate DOI races and upload size/content validation.
- `generate-reading-dna`: explicitly validates user token, derives user ID from auth, applies a per-user rate limit, and reads that user's bookshelf via caller-scoped client.
- `book-ratings`: POST calls `getUser()` before upsert and uses verified user ID; GET uses service role but returns only aggregate rating/count, not individual ratings. Add strict numeric bounds/UUID validation and pagination/aggregate SQL if rating volume grows; ensure client cannot spoof user_id.
- `send-contact-email`: public endpoint, input validation/HTML escaping and length caps observed; still susceptible to email abuse without server-side rate limiting/CAPTCHA and strict subject/from controls. Add abuse controls before treating as production-safe.
- `save-selected-books`: guest-accessible and uses service role for catalog writes by design; batch limit 50 and book sanitization observed. Review duplicate/upsert semantics, source URL/PDF URL validation, and abuse/rate limiting before allowing unrestricted writes.

This is a focused review of selected high-impact functions, not all 26 handlers. No new production changes were made in this continuation.
