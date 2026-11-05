# Google reCAPTCHA v3

## Frontend

Set `VITE_RECAPTCHA_SITE_KEY` in Cloudflare Pages build environment variables. Auth forms call `executeRecaptcha('signin'|'signup')` at submission time and pass the resulting token to Supabase Auth's `captchaToken` option. Tokens are short-lived and single-use; generate a fresh token for every attempt.

## Supabase Edge Functions

Set `RECAPTCHA_SECRET_KEY` in Supabase Edge Function secrets. Import `verifyRecaptcha` from `../_shared/recaptcha.ts` (adjust relative path) and reject the request unless `result.valid` is true. The helper verifies token success, exact action, hostname, and a score threshold (default 0.5). Configure score tuning based on production observations.

Example:

```ts
const result = await verifyRecaptcha(body.recaptchaToken, 'contact');
if (!result.valid) return jsonResponse({ error: 'Bot verification failed' }, 403);
```

For Supabase Auth signup/signin, configure the same secret in Supabase Auth > Bot and Abuse Protection so Supabase validates the `captchaToken` independently.
