const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim();

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let scriptPromise: Promise<void> | undefined;

/** Loads Google's reCAPTCHA v3 script once per browser session. */
function loadRecaptcha(): Promise<void> {
  if (window.grecaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const scriptId = 'google-recaptcha-v3';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
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
    const onLoad = () => window.grecaptcha
      ? finish()
      : finish(new Error('reCAPTCHA API unavailable after script load'));
    const onError = () => finish(new Error('Unable to load Google reCAPTCHA'));
    const timeoutId = window.setTimeout(
      () => finish(new Error('Google reCAPTCHA loading timed out')),
      15000
    );

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY ?? '')}`;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      if (script.readyState === 'complete' && !window.grecaptcha) {
        finish(new Error('Existing reCAPTCHA script is loaded but its API is unavailable'));
      }
    }
  }).catch((error: unknown) => {
    scriptPromise = undefined;
    throw error;
  });
  return scriptPromise;
}

/**
 * Generates a short-lived, single-use reCAPTCHA v3 token for a specific action.
 * The token must be sent to a trusted backend and verified before the action is accepted.
 */
export async function executeRecaptcha(action: 'signin' | 'signup' | 'password_reset' | 'contact' | string): Promise<string> {
  if (!SITE_KEY) throw new Error('Google reCAPTCHA is not configured. Please try again later.');
  if (!/^[a-zA-Z0-9_/]{1,64}$/.test(action)) throw new Error('Invalid reCAPTCHA action');

  await loadRecaptcha();
  return new Promise<string>((resolve, reject) => {
    window.grecaptcha?.ready(() => {
      window.grecaptcha?.execute(SITE_KEY, { action })
        .then((token) => token ? resolve(token) : reject(new Error('reCAPTCHA returned an empty token')))
        .catch(reject);
    });
  });
}
