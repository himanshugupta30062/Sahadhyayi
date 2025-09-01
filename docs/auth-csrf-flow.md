# Sign-in, Server Session, and CSRF Flow

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

## Client Responsibilities
- After Supabase signs in a user, call `sessionClientLogin()` to mint the server session and CSRF token.
- Store the `csrfToken` in `localStorage` and send it on each protected request via `secureFetch()`.
- On `SIGNED_OUT`, clear user data and CSRF token and notify the server with `DELETE /api/session`.
- `secureFetch()` automatically retries once on `401/403` and updates the token if the server rotates it via `X-New-CSRF-Token`.

## Server Responsibilities
- `POST /api/session` validates the Supabase user, sets an HttpOnly `sessionId` cookie, and returns a JSON `csrfToken`.
- `DELETE /api/session` clears or invalidates the session cookie.
- Protected endpoints require both the cookie and matching `X-CSRF-Token` header.
- Optionally rotate the CSRF token per request and return `X-New-CSRF-Token` so the client can persist it.

## Test Checklist
- **Fresh login** – signing in calls `/api/session` and populates `localStorage` with a CSRF token.
- **Idle expiry** – removing the `sessionId` cookie triggers one background refresh and retry.
- **Rotation** – when the server sends `X-New-CSRF-Token`, the client saves it for the next call.
- **Logout** – signing out clears both the cookie (server) and local token (client).

## Deployment Checklist
- Hooks only run in React components/providers; utility code is hook-free.
- Guard all `localStorage` access with `typeof window` to avoid SSR crashes.
- Ensure protected requests use `secureFetch()` so cookies and headers are sent together.
- **Netlify** – add Supabase environment variables and allow credentials in CORS; verify `netlify.toml` doesn’t strip cookies.
- **Cloudflare** – forward credentials with `fetch` and include `Access-Control-Allow-Credentials: true` on API responses.
- **Vercel** – avoid edge middleware that intercepts `/api/session` and ensure cookies aren’t stripped.

### README Snippet
- Idle users previously kept a Supabase session while the server cookie expired, causing writes to fail.
- `secureFetch()` now refreshes the session once on `401/403` and retries the request automatically.
- CSRF rotation can be toggled on the server when sending responses; the client persists new tokens from `X-New-CSRF-Token`.

## Quick "Did we deploy right?" sanity list
- `sessionId` is an **HttpOnly** cookie visible in DevTools but not accessible to JavaScript.
- `csrfToken` appears in `localStorage` after login.
- Protected writes include the `X-CSRF-Token` header and send cookies.
- Deleting the `sessionId` cookie results in a single background refresh and retry.
- Logging out removes the cookie server-side and clears the CSRF token client-side.
