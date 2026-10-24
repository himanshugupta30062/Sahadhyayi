# Cloudflare Pages migration runbook

This repository is a React + Vite application. This change prepares response headers for Cloudflare Pages; it does **not** change production DNS or move the Supabase backend.

## 1. Create a Pages project

In the Cloudflare dashboard, open **Workers & Pages → Create → Pages → Connect to Git** and select `himanshugupta30062/Sahadhyayi`.

Use these settings:

- Production branch: `main`
- Framework preset: React (Vite)
- Root directory: repository root (leave blank)
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `22` (set `NODE_VERSION=22` if the build environment does not already use it)

The repository build script also creates `server-utils/`; the static Pages deployment publishes only `dist/`. This does not deploy or replace a Node/Express server. Confirm any production features that depend on `/api`, `/goodreads`, or `/discussions` have their existing separately hosted backend and correct production URLs before switching traffic.

## 2. Configure build environment variables

Copy the required **build-time** variables from the existing hosting configuration into **Pages → Settings → Environment variables** for both Production and Preview as appropriate. At minimum, verify:

- `VITE_SUPABASE_URL` — the project API URL, not the Supabase dashboard URL.
- `VITE_SUPABASE_ANON_KEY` — the existing public anon/publishable key.

Also copy any other `VITE_*` variables the app currently uses. Never put a Supabase service-role key, database password, or other server secret in a `VITE_*` variable; Vite exposes these values in the client bundle. Do not remove the current deployment while testing.

## 3. Validate the Pages preview before DNS

Test the generated `*.pages.dev` URL before adding the production domain:

- Homepage loads without a blank screen or uncaught configuration errors.
- Direct navigation and refresh work for routes such as `/library`, author pages, social pages, and `/admin/author-enrichment`.
- Sign-in/sign-up, Supabase reads/writes, Edge Functions, storage, and realtime work.
- Book search/reader, author pages, social feed/groups, maps, and analytics work.
- Browser console and Network panel show no CSP violations, failed API requests, or missing assets.

The existing `public/_redirects` file supplies the SPA fallback. The `public/_headers` file in this branch preserves the security headers and immutable asset caching previously defined in `netlify.toml`.

## 4. Custom domain and DNS — do this only after preview passes

1. In Pages → Custom domains, add `sahadhyayi.com` and follow Cloudflare's on-screen setup. Add `www.sahadhyayi.com` too if it should continue working.
2. If moving authoritative DNS to Cloudflare, first import/review the full existing DNS zone. Compare against the current DNS provider and preserve all email records: MX, SPF, DKIM, DMARC, and any mail-verification TXT/CNAME records. Preserve other verification records and any records used by APIs.
3. Confirm the Cloudflare nameservers assigned to the zone, then update nameservers at the domain registrar to those exact values. Do not use generic nameserver values.
4. Keep email-related records **DNS only** (not proxied). For the web domain, follow the Pages custom-domain setup instructions; do not invent A/AAAA addresses for Pages.
5. Verify the zone is Active and TLS certificates are issued. Test apex and www over HTTPS, redirects, email sending/receiving, and Supabase Auth callback/redirect URLs.

Do not delete the old hosting project until the new domain has been stable and tested. Keep a record of the old DNS values so rollback is possible.

## 5. Legacy-domain redirects

The old Netlify configuration redirects `sahadhyayi.app` and `www.sahadhyayi.app` to `sahadhyayi.com`. Configure equivalent Cloudflare redirect rules separately if those domains are still owned and in use; do not assume Netlify TOML rules are automatically applied by Pages.

## 6. Supabase

The frontend migration should not require a Supabase database migration. Keep the same Supabase project and confirm its Auth URL configuration allows the production and temporary preview URLs as needed. Avoid making broad redirect allow-list changes; use the narrow URLs required for testing and production.


## 7. Deploy the Node API separately

The Cloudflare Worker configuration in `wrangler.jsonc` serves only `dist/`; it does not run `server.js` or Socket.IO. The repository now includes a Render Blueprint (`render.yaml`) for the Express API. Deploy it from Render's Blueprint flow, provide the required Supabase service-role key and any optional integration secrets, and attach a custom domain such as `api.sahadhyayi.com` to the service. Configure `VITE_BACKEND_URL=https://api.sahadhyayi.com` in the frontend's Cloudflare build environment and redeploy the frontend. Keep this API domain on the same registrable domain as the frontend so secure cookie flows can work with the existing SameSite policy.

The `/health` endpoint is a process-health probe only; it does not prove database, auth, or external integrations are healthy. After deployment, verify `/health`, sign-in/session renewal, Goodreads routes if configured, speech-to-text, LibGen proxy, and Socket.IO at `/discussions` before calling the backend migration complete.
