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
