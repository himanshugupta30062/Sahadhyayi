export interface RecaptchaClient {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: RecaptchaClient & {
      enterprise?: RecaptchaClient;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim();
const USE_ENTERPRISE = import.meta.env.VITE_RECAPTCHA_USE_ENTERPRISE !== 'false';

/**
 * Returns true if a Google reCAPTCHA site key is configured.
 */
export const isRecaptchaConfigured = (): boolean => Boolean(SITE_KEY);

/**
 * Returns the configured reCAPTCHA site key.
 */
export const getRecaptchaSiteKey = (): string | undefined => SITE_KEY;

/**
 * Returns whether enterprise.js is enabled (defaults to true for Google Cloud Fraud Defense / Enterprise keys).
 */
export const isRecaptchaEnterprise = (): boolean => USE_ENTERPRISE;

let scriptPromise: Promise<void> | undefined;

function getClient(): RecaptchaClient | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.grecaptcha?.enterprise ?? window.grecaptcha;
}

/**
 * Loads Google's reCAPTCHA Enterprise (or standard v3) script once per browser session.
 */
export function loadRecaptcha(): Promise<void> {
  if (getClient()) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve();
      return;
    }

    const scriptId = 'google-recaptcha-script';
    let script = (document.getElementById(scriptId) ||
      document.getElementById('google-recaptcha-v3')) as HTMLScriptElement | null;
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
    };

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };

    const onLoad = () => {
      if (getClient()) {
        finish();
      } else {
        window.setTimeout(() => {
          if (getClient()) finish();
          else finish(new Error('reCAPTCHA API unavailable after script load'));
        }, 50);
      }
    };

    const onError = () => finish(new Error('Unable to load Google reCAPTCHA'));

    const timeoutId = window.setTimeout(
      () => finish(new Error('Google reCAPTCHA loading timed out')),
      15000
    );

    const scriptUrl = USE_ENTERPRISE
      ? `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(SITE_KEY ?? '')}`
      : `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY ?? '')}`;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      if (script.readyState === 'complete') {
        onLoad();
      }
    }
  }).catch((error: unknown) => {
    scriptPromise = undefined;
    throw error;
  });

  return scriptPromise;
}

/**
 * Generates a short-lived, single-use reCAPTCHA token for a specific user action.
 * For Google reCAPTCHA Enterprise score-based keys, this executes in the background
 * without prompting users with interactive challenges.
 */
export async function executeRecaptcha(
  action: 'signin' | 'signup' | 'password_reset' | 'confirm_email_resend' | 'contact' | string
): Promise<string> {
  if (!action || !/^[a-zA-Z0-9_/]{1,64}$/.test(action)) {
    throw new Error('Invalid reCAPTCHA action');
  }

  // In automated test environments without a configured site key, return a mock token
  // so tests exercising auth flows do not fail on external network dependencies.
  if (!SITE_KEY && (import.meta.env.MODE === 'test' || typeof vi !== 'undefined')) {
    return 'test-recaptcha-token';
  }

  if (!SITE_KEY) {
    throw new Error('Google reCAPTCHA is not configured. Please try again later.');
  }

  await loadRecaptcha();

  return new Promise<string>((resolve, reject) => {
    const client = getClient();
    if (!client) {
      reject(new Error('Google reCAPTCHA API unavailable'));
      return;
    }

    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Google reCAPTCHA execution timed out'));
    }, 10000);

    client.ready(() => {
      client.execute(SITE_KEY, { action })
        .then((token) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          if (token) resolve(token);
          else reject(new Error('reCAPTCHA returned an empty token'));
        })
        .catch((err) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          reject(err);
        });
    });
  });
}

/**
 * Initializes and preloads Google reCAPTCHA Enterprise in the background.
 * Installing score-based keys across the site allows Google's risk engine
 * to collect natural browsing telemetry, improving score accuracy.
 */
export function initRecaptcha(): void {
  if (typeof window === 'undefined' || !SITE_KEY) return;
  loadRecaptcha().catch((err) => {
    console.warn('[reCAPTCHA] Background initialization warning:', err);
  });
}

// Automatically initiate background telemetry loading if site key is configured
if (typeof window !== 'undefined' && SITE_KEY && import.meta.env.MODE !== 'test') {
  initRecaptcha();
}
