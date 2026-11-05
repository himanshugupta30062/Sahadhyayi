# Sahadhyayi CAPTCHA configuration

Sahadhyayi uses **Cloudflare Turnstile for Supabase Auth CAPTCHA**. Google reCAPTCHA Enterprise is optional and remains a separate risk/telemetry layer; its tokens must not be passed to Supabase Auth.

## 1. Create a Cloudflare Turnstile widget

1. In Cloudflare Dashboard, open **Turnstile** and create a widget for Sahadhyayi.
2. Add allowed hostnames: `sahadhyayi.com`, `www.sahadhyayi.com`, and your local development hostname (for example `localhost`).
3. Use the widget's **sitekey** as the public build variable `VITE_TURNSTILE_SITE_KEY`.
4. Keep the Turnstile **secret key** private. Never put it in a `VITE_*` variable, Git file, or client bundle.

## 2. Enable CAPTCHA in Supabase Auth

In Supabase Dashboard → **Authentication → Bot and Abuse Protection**:

1. Enable CAPTCHA protection.
2. Select **Cloudflare Turnstile**.
3. Paste the Turnstile **secret key**.
4. Save the configuration.

Supabase Auth will verify the token supplied in the `captchaToken` option for signup, password sign-in, and password-reset email requests.

## 3. Configure Cloudflare Pages

In Cloudflare Pages → Sahadhyayi project → **Settings → Environment variables**:

- Set `VITE_TURNSTILE_SITE_KEY` for Production and Preview (use appropriate widget hostnames).
- Keep the sitekey public; do not set the Turnstile secret in the frontend build.
- Trigger a **new deployment** after changing build variables. Vite variables are embedded at build time.

For local development, add `VITE_TURNSTILE_SITE_KEY` to your local `.env` and allow `localhost` in the widget.

## 4. Keep Google reCAPTCHA Enterprise separate (optional)

If Google Enterprise is enabled, configure `VITE_RECAPTCHA_SITE_KEY` for its browser telemetry and the server-side assessment credentials in Supabase Edge Function secrets. The Enterprise secret/API key must never be exposed as a `VITE_*` variable.

Use `verifyRecaptcha()` only from trusted Edge Functions for custom actions. Do not pass a Google Enterprise token as Supabase Auth's `captchaToken`.

## 5. Smoke test

- Signup: Turnstile appears, successful challenge allows signup; missing/expired token blocks it.
- Sign-in: challenge token is sent to Supabase Auth; invalid or expired token is rejected and the widget refreshes after attempt.
- Password reset: challenge token is sent with `resetPasswordForEmail`.
- Check browser console/network for Turnstile script errors and Supabase Auth CAPTCHA verification errors.
