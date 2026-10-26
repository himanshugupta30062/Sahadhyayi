# Signup security setup

The signup UI intentionally fails closed when Cloudflare Turnstile is not configured. The browser token is passed to Supabase Auth, but **Supabase must validate it server-side**; a frontend challenge alone is not a security boundary.

## 1. Configure Cloudflare Turnstile

1. Create a Turnstile widget in the Cloudflare dashboard.
2. Allow the production hostnames `sahadhyayi.com` and `www.sahadhyayi.com`. Add preview/local hostnames only when they are needed for testing.
3. Copy the **site key** to the frontend deployment environment as `VITE_TURNSTILE_SITE_KEY`. It is public and will be included in the built site; never place the secret key in a `VITE_*` variable.

Set `VITE_TURNSTILE_SITE_KEY` in every active frontend hosting target (Cloudflare Pages and/or Netlify, including the production deployment). Rebuild/redeploy after changing build-time variables.

The Netlify Content Security Policy now permits Turnstile's script and challenge iframe via `script-src` and `frame-src`. If another layer (for example, a Cloudflare response-header transform) sets an additional CSP, it must also allow `https://challenges.cloudflare.com` in those directives.

## 2. Enable server-side CAPTCHA validation in Supabase

In the production Supabase project:

1. Open **Authentication → Bot and Abuse Protection** (wording may vary).
2. Enable CAPTCHA protection and select **Cloudflare Turnstile**.
3. Paste the matching **Turnstile secret key** into Supabase's secret-key field and save.
4. Test a valid token and an absent/invalid token. Supabase must reject signup when its CAPTCHA validation is missing or invalid.

Keep the secret exclusively in Supabase's dashboard/settings. Do not commit it or put it in a browser environment variable.

## 3. Require email confirmation

In **Authentication → Providers → Email**, enable the email-confirmation requirement (disable any “Confirm email”/auto-confirm setting that automatically confirms new users). Then check **Authentication → URL Configuration**:

- Site URL: `https://sahadhyayi.com`
- Redirect URLs should include `https://sahadhyayi.com/confirm-email` and `https://www.sahadhyayi.com/confirm-email`.
- Add exact local/preview callback URLs only when needed.

Signup links now return to `/confirm-email`, which handles Supabase PKCE `code` and OTP `token_hash` confirmation links. Do not rely on the frontend success message as proof of verification; confirm that a newly created test user has no `email_confirmed_at` timestamp until the link is clicked, and that signing in before confirmation is rejected.

## 4. Enable breached-password protection

In Supabase's Auth password security settings, enable leaked-password protection. Keep the frontend password checks for usability, but treat the Supabase server-side password policy as authoritative.

## 5. Production verification checklist

- [ ] The production build has `VITE_TURNSTILE_SITE_KEY` set.
- [ ] The active production site's CSP allows `https://challenges.cloudflare.com` in `script-src` and `frame-src`.
- [ ] Supabase Auth has Turnstile enabled with the corresponding secret.
- [ ] Signup fails when no challenge token is present or when a token is invalid/expired.
- [ ] Signup creates an unconfirmed email user and sends a confirmation message.
- [ ] Confirming the message returns to `/confirm-email`, verifies the address, and enables sign-in.
- [ ] Leaked-password protection is enabled.
- [ ] Test Google/GitHub OAuth separately; provider-based signup is a separate identity path from email/password signup.

**Operational note:** Repository changes can wire the challenge and confirmation route, but the live Auth toggles and provider secret must be saved in the Supabase dashboard. Do not consider production signup hardened until the checks above pass.


## Production issue triage (2026-10-25)

If the signup form shows `Signup verification is not configured yet`, the frontend build does not have `VITE_TURNSTILE_SITE_KEY` embedded. This variable is read at build time by `TurnstileCaptcha`; adding it at runtime without rebuilding does not fix the existing static bundle.

If the form shows `Please complete the anti-bot verification before creating your account`, no Turnstile token reached the signup handler. First fix the site-key/widget load and verify that the widget's success callback sets the token. Do not remove the token check to bypass this error.

After the widget works, Supabase Authentication must have CAPTCHA protection enabled with provider Cloudflare Turnstile and the matching server-side secret. A site key and secret are a pair from the same Turnstile widget. Set the public site key only in the active frontend build configuration; never put the secret in VITE_* or commit it. The live auth CAPTCHA configuration must be saved in Supabase Dashboard; this repository integration cannot safely change that setting.


## Production email verification incident (2026-10-26)

Issue tracker: https://github.com/himanshugupta30062/Sahadhyayi/issues/907

### Observed failure signatures

Supabase Auth logs reviewed during the 2026-10-26 investigation include:

- `POST /verify` returning `otp_expired` / HTTP 403.
- `GET /verify` returning `One-time token not found` after a prior successful confirmation event.
- `POST /resend` returning HTTP 200 on some attempts.
- Earlier `POST /resend` attempts returning `captcha_failed` because the request did not include a CAPTCHA token.
- `/token?grant_type=password` returning `email_not_confirmed` for an account that had not been confirmed.

These events indicate multiple conditions across different test/account attempts; they do not prove every user has the same root cause. A successful resend request should not be assumed to mean that an already-sent older email/code remains valid.

### Required Auth template/config audit

1. Check **Authentication → Emails → Confirm sign up** and **Authentication → Emails → Magic Link** (OTP template). Confirm the exact saved production templates. The template used for signup confirmation must render `{{ .Token }}` as a manual code. For the intended OTP-first flow, do not also expose a clickable single-use `{{ .ConfirmationURL }}` or `{{ .TokenHash }}` link in that email.
2. The only CTA in the OTP template should open the ordinary app route `https://www.sahadhyayi.com/confirm-email`; it should not embed an Auth verification token.
3. Check **Authentication → URL Configuration** for both production hostnames only when needed: `https://sahadhyayi.com/confirm-email` and `https://www.sahadhyayi.com/confirm-email`.
4. Check **Authentication → Bot and Abuse Protection**: the CAPTCHA provider and secret must match the Cloudflare Turnstile widget whose site key is in the production frontend build.
5. Check **Authentication → Providers → Email** to confirm the email-confirmation policy is intentionally enabled. Do not disable confirmation as a workaround.

The application can store and render its own copy, but the Supabase Dashboard's live Auth templates and provider/CAPTCHA switches are separate settings and must be explicitly checked there.

### Incident response and reproduction

- Test with a fresh email account; old one-time codes and links cannot be reused after consumption or expiry.
- Do not repeatedly request codes in quick succession; request once, wait for that email, and try its code first.
- Record the time, endpoint status, error code, and request ID only. Never store OTPs, token hashes, passwords, or full confirmation URLs in logs or tickets.
- Verify email state before and after the test in Auth Users, then verify sign-in behavior after successful confirmation.
- Re-test resend with a valid, unexpired Turnstile token and confirm the API request includes `captcha_token`.
- Keep CAPTCHA fail-closed. Do not disable CAPTCHA, disable email confirmation, or set Auth confirmation timestamps manually to bypass the failures.

### Current code expectations

The existing implementation prefers manual OTP entry and handles the stale-link message in `src/pages/ConfirmEmail.tsx`. The resend path uses `supabase.auth.resend({ type: 'signup', email, options: { captchaToken } })` and requires a fresh Turnstile token. The verification handler uses `verifyOtp({ email, token, type: 'signup' })`; regression coverage exists in `src/pages/ConfirmEmail.test.tsx`.

If a newly sent code is still rejected, audit the exact email template used by Supabase and inspect the associated Auth log timestamps and request IDs. Do not assume the frontend copy alone fixes the saved production Auth configuration.
