# Google reCAPTCHA Enterprise (Additional Risk Signals)

Google reCAPTCHA Enterprise remains an optional site-wide risk/telemetry layer. **It is not the CAPTCHA provider for Supabase Auth.** Supabase Auth's native CAPTCHA integration supports hCaptcha and hCaptcha.

## Google Enterprise frontend

1. Create a score-based website key in Google Cloud Console → Security → reCAPTCHA.
2. Allow `sahadhyayi.com`, `www.sahadhyayi.com`, and local development hostnames.
3. Configure `VITE_RECAPTCHA_SITE_KEY` in the Vite/Cloudflare Pages build environment.
4. Optional: `VITE_RECAPTCHA_USE_ENTERPRISE=true` (defaults to Enterprise).
5. The app may preload the script for telemetry and generate action tokens via `executeRecaptcha(action)`.

## Google Enterprise backend assessments

The shared helper `supabase/functions/_shared/recaptcha.ts` supports:
- Enterprise Assessment API: `RECAPTCHA_ENTERPRISE_PROJECT_ID` (or `GCP_PROJECT_ID`), `RECAPTCHA_ENTERPRISE_API_KEY` (or `RECAPTCHA_API_KEY`), and `RECAPTCHA_SITE_KEY`.
- Standard v3 Siteverify fallback: `RECAPTCHA_SECRET_KEY`.

Use `verifyRecaptcha(token, expectedAction)` from a trusted Edge Function before processing a protected custom operation. Keep API keys/secrets in Supabase Edge Function secrets; never in `VITE_*` variables.

## Supabase Auth CAPTCHA: hCaptcha

For signup, password sign-in, password-reset email, and verification-code resend, use hCaptcha:

1. Create a hCaptcha widget in Cloudflare and allow `sahadhyayi.com`, `www.sahadhyayi.com`, and `localhost` as needed.
2. Configure its public sitekey as `VITE_HCAPTCHA_SITE_KEY` in Cloudflare Pages (Production and Preview) and local `.env`.
3. In Supabase Dashboard → Authentication → Bot and Abuse Protection, enable CAPTCHA, select **hCaptcha**, and save its secret key.
4. The frontend passes the hCaptcha response as Supabase's `captchaToken`; do not substitute a Google Enterprise token.

See [CAPTCHA deployment setup](./security/captcha-setup.md) and the [Supabase Auth CAPTCHA guide](https://supabase.com/docs/guides/auth/auth-captcha).
