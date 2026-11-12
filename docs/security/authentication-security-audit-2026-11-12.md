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
