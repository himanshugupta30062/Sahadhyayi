# Migrate public website references to sahadhyayi.app

## Scope
- Replace public website links using `sahadhyayi.com` or `www.sahadhyayi.com` with the active primary domain, `https://sahadhyayi.app`.
- Update canonical URLs, social sharing URLs, structured data, sitemap and robots references, deployment metadata, CORS allowlists, and documentation.
- Update the legacy GitHub Pages `CNAME` so it no longer points at the former domain.
- Keep `@sahadhyayi.com` email addresses unchanged; changing the website domain does not imply the email domain has changed.

## Validation
- Confirm both `.app` domains are active and the root domain is primary.
- Re-scan the repository for obsolete website-domain references.
- Run lint and the production build, then check preview diagnostics.

## Technical details
The replacement is limited to URL/host references. Supabase configuration, user data, and email delivery settings are not changed.
