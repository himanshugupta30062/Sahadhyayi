# Cloudflare Workers static asset routing

Sahadhyayi is deployed as an assets-only Worker. The production build is created by
`npm run build` in `dist/`, and `wrangler.jsonc` uses
`not_found_handling: "single-page-application"` to serve the SPA shell for client-side routes.

## Why there is no `public/_redirects`

The previous Netlify-style `_redirects` file used external destination URLs,
HTTP 404 status rules, and a catch-all rewrite to `/index.html`. Wrangler rejects
those rules when publishing Workers static assets. The SPA fallback is configured
directly in `wrangler.jsonc`, so a separate catch-all rewrite is unnecessary.

## Redirects for legacy domains

Configure redirects from `sahadhyayi.app/*` and
`www.sahadhyayi.app/*` to `https://sahadhyayi.com/$1` using Cloudflare
Redirect Rules (or Bulk Redirects), rather than a static `_redirects` file.
Keep the canonical domain and destination URLs aligned with the active DNS setup.

## Deploy settings

- Build command: `npm run build`
- Deploy command: `npm run deploy:cloudflare` (pins Wrangler to `4.156.0` for reproducible deployments)
- Node version: `22`

The build requires the public Supabase URL/key and any enabled frontend integration
keys to be configured as build environment variables in Cloudflare.
