# Auth Session & CSRF Flow

```mermaid
flowchart TD
  A[User submits form] --> B[SignIn.tsx calls AuthContext.signIn]
  B --> C[Supabase auth.signInWithPassword]
  C -->|SIGNED_IN| D[AuthContext onAuthStateChange]
  D --> E[sessionClientLogin() -> POST /api/session]
  E -->|200 + csrfToken| F[Store csrfToken in localStorage<br/>Server sets HttpOnly sessionId cookie]
  F --> G[Redirect to /app (protected area)]
  G --> H[secureFetch() attaches X-CSRF-Token + credentials]
  H --> I[Backend checks cookie + CSRF token]
  I -->|OK| J[Normal API response]
  I -->|401/403| K[secureFetch one-time recovery]
  K --> L[sessionClientLogin() -> POST /api/session]
  L -->|success| M[Retry original request with fresh CSRF]
  M --> J[Normal API response]
  L -->|fail| N[Bubble error -> UI shows re-auth prompt]
  D -->|SIGNED_OUT| O[Clear user/session + csrfToken; DELETE /api/session]
```

## Client vs Server Responsibilities
- **Client**: manages Supabase auth, stores the CSRF token in `localStorage`, and sends it on every request via `secureFetch`. A 401/403 triggers a single automatic refresh via `/api/session`.
- **Server**: verifies the Supabase user, maintains an `HttpOnly` session cookie, and validates the double-submit CSRF token. It may rotate the CSRF token and return `X-New-CSRF-Token` when needed.

### Why sessions could fail before
Idle tabs kept an expired server session or stale CSRF token, so protected fetches started failing with 401/403 without recovery.

### How secureFetch recovers
`secureFetch` automatically calls `sessionClientLogin()` once on 401/403, then retries the original request with the new token.

### CSRF rotation toggle
Rotate tokens on the server and reply with `X-New-CSRF-Token`; the client persists it automatically through `secureFetch`.

## Test Checklist
- Fresh login sets `sessionId` cookie and `csrfToken`.
- Idle expiry: deleting the cookie causes one background refresh and retry.
- Rotation: server-sent `X-New-CSRF-Token` is stored immediately.
- Logout clears both cookie (server) and CSRF token (client).

## Deployment Checklist
- **Netlify**: expose Supabase keys via env vars; ensure `Access-Control-Allow-Origin` matches your site; allow `Set-Cookie` headers.
- **Cloudflare**: forward credentials in Workers; set `Access-Control-Allow-Credentials: true`.
- **Vercel**: avoid middleware that strips cookies; ensure `/api/session` isn't redirected.
- CORS: responses must include `Access-Control-Allow-Credentials: true` and a specific `Access-Control-Allow-Origin`.

## Quick "Did we deploy right?" sanity list
- ✅ `sessionId` is **HttpOnly** cookie visible in DevTools (but not via JS).
- ✅ `csrfToken` exists in localStorage after login.
- ✅ Write requests show `X-CSRF-Token` header and **send cookies**.
- ✅ Deleting `sessionId` causes **one** background refresh + retry.
- ✅ Logout removes both cookie (server) and CSRF (client).
