# Google reCAPTCHA Enterprise (Score-Based Keys)

Sahadhyayi uses Google reCAPTCHA Enterprise with score-based keys (no interactive challenge) to protect user actions while preserving a seamless, frictionless user experience.

## Frontend Setup

1. **Obtain your Site Key**:
   - Go to Google Cloud Console > Security > [reCAPTCHA Enterprise / Google Cloud Fraud Defense](https://console.cloud.google.com/security/recaptcha).
   - Create or copy a **score-based website key** (Integration type: Score based, no challenge).
   - Add your domains (e.g. `sahadhyayi.com`, `www.sahadhyayi.com`, `localhost`).
2. **Environment Variable**:
   - Set `VITE_RECAPTCHA_SITE_KEY` in Cloudflare Pages build environment variables or `.env`.
   - (Optional) `VITE_RECAPTCHA_USE_ENTERPRISE=true` (defaults to `true`, which loads `https://www.google.com/recaptcha/enterprise.js?render=KEY_ID`).
3. **Execution & Telemetry**:
   - As recommended by Google Fraud Defense documentation, the enterprise script is automatically preloaded in the background across all pages on app initialization (`initRecaptcha()`), allowing Google's risk engine to collect natural browsing telemetry.
   - On critical user interactions (Sign In, Sign Up, Confirm Email resend, etc.), `executeRecaptcha('action_name')` generates an encrypted single-use assessment token.
   - The token is passed to Supabase Auth (`options: { captchaToken }`).

## Backend Verification (Supabase Auth & Edge Functions)

### 1. Supabase Auth
- In Supabase Dashboard > Authentication > Bot and Abuse Protection:
  - Enable Captcha Protection.
  - Select your provider (Google reCAPTCHA Enterprise / v3 or Turnstile).
  - Enter your Secret / Service Account credentials. Supabase validates the `captchaToken` on `signInWithPassword` and `signUp`.

### 2. Custom Edge Functions (`supabase/functions/_shared/recaptcha.ts`)
- The helper `verifyRecaptcha(token, action, options)` supports both:
  - **Google Cloud reCAPTCHA Enterprise Assessment API**:
    - `RECAPTCHA_ENTERPRISE_PROJECT_ID` (or `GCP_PROJECT_ID`)
    - `RECAPTCHA_ENTERPRISE_API_KEY` (or `RECAPTCHA_API_KEY`)
    - `RECAPTCHA_SITE_KEY`
  - **Standard reCAPTCHA v3 siteverify**:
    - `RECAPTCHA_SECRET_KEY`

```ts
import { verifyRecaptcha } from '../_shared/recaptcha.ts';

const result = await verifyRecaptcha(body.recaptchaToken, 'contact');
if (!result.valid) {
  return new Response(JSON.stringify({ error: 'Bot verification failed', reason: result.error }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
```
