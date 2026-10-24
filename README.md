# Sahadhyayi

Sahadhyayi is a reading community built with React, TypeScript, Vite, and Supabase.

## Production hosting

The frontend is configured for **Cloudflare Workers static assets** through `wrangler.jsonc`. The production build is generated into `dist/`, with single-page application routing configured in Wrangler.

- Production website: https://www.sahadhyayi.com
- Source repository: https://github.com/himanshugupta30062/Sahadhyayi
- Build: `npm run build`
- Local development: `npm run dev`
- Production preview: `npm run preview`
- Lint: `npm run lint`
- Tests: `npm test`

## Local setup

1. Install Node.js 22 or a compatible supported version.
2. Install dependencies with `npm ci`.
3. Create a local `.env` file from `.env.example` and configure required variables.
4. Run `npm run dev`.

Do not commit secrets or service-role keys. Never place server-only credentials in `VITE_*` variables.

## Backend

The frontend uses Supabase for authentication and data. The Express API and real-time discussion server are separate from the static frontend and must be deployed/configured independently where required. See `docs/cloudflare-pages-migration.md` for deployment notes.

## Security and operations

Review `docs/SignupSecurity.md` before changing signup protection or production hostnames. Configure Turnstile and any optional integrations in the active deployment environment before enabling those features.
