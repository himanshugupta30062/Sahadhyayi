export const HCAPTCHA_API_URL = 'https://js.hcaptcha.com/1/api.js?render=explicit';

export type HCaptchaTheme = 'light' | 'dark' | 'auto';
export type HCaptchaSize = 'normal' | 'compact' | 'invisible';

export interface HCaptchaRenderOptions {
  sitekey: string;
  theme?: 'light' | 'dark';
  size?: HCaptchaSize;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (error: unknown) => void;
  'close-callback'?: () => void;
  'open-callback'?: () => void;
}

export interface HCaptchaApi {
  render: (container: HTMLElement | string, options: HCaptchaRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
  execute: (widgetId?: string) => Promise<{ response: string; key: string }> | void;
  getResponse: (widgetId?: string) => string;
}

declare global {
  interface Window {
    hcaptcha?: HCaptchaApi;
  }
}

export const getHcaptchaSiteKey = (): string | undefined => {
  const key = import.meta.env.VITE_HCAPTCHA_SITE_KEY?.trim();
  return key || undefined;
};

export const isHcaptchaConfigured = (): boolean => Boolean(getHcaptchaSiteKey());

let hcaptchaScriptPromise: Promise<void> | null = null;

export function _resetHcaptchaForTesting(): void {
  hcaptchaScriptPromise = null;
}

export function loadHcaptcha(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.hcaptcha) return Promise.resolve();
  if (hcaptchaScriptPromise !== null) return hcaptchaScriptPromise;

  hcaptchaScriptPromise = new Promise<void>((resolve, reject) => {
    const scriptId = 'hcaptcha-api-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const onLoad = () => {
      if (window.hcaptcha) resolve();
      else reject(new Error('hCaptcha loaded without its API.'));
    };
    const onError = () => reject(new Error('Could not load hCaptcha service.'));

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = HCAPTCHA_API_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      document.head.appendChild(script);
      return;
    }

    if (window.hcaptcha) {
      resolve();
      return;
    }

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
  }).catch((error: unknown) => {
    hcaptchaScriptPromise = null;
    throw error;
  });

  return hcaptchaScriptPromise;
}

