import { useEffect, useRef, useState } from 'react';

type TurnstileOptions = {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  theme?: 'auto' | 'light' | 'dark';
  action?: string;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Turnstile is only available in a browser.'));
  }
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const scriptId = 'cloudflare-turnstile-api';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    let settled = false;
    const timeout = window.setTimeout(() => finish(new Error('Turnstile loading timed out.')), 15000);

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
      if (error) reject(error);
      else resolve();
    };
    const onLoad = () => window.turnstile
      ? finish()
      : finish(new Error('Turnstile loaded without its API.'));
    const onError = () => finish(new Error('Unable to load Cloudflare Turnstile.'));

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
    }
  }).catch((error: unknown) => {
    turnstileScriptPromise = null;
    throw error;
  });

  return turnstileScriptPromise;
}

type TurnstileCaptchaProps = {
  onTokenChange: (token: string | null) => void;
  action: 'signin' | 'signup' | 'password_reset' | string;
};

/** Cloudflare Turnstile widget used to obtain Supabase-compatible CAPTCHA tokens. */
export function TurnstileCaptcha({ onTokenChange, action }: TurnstileCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing-key'>('loading');
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    let cancelled = false;
    let widgetId: string | undefined;
    onTokenChangeRef.current(null);

    if (!siteKey) {
      setStatus('missing-key');
      return;
    }

    setStatus('loading');
    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: 'auto',
          callback: (token) => {
            if (cancelled) return;
            setStatus('ready');
            onTokenChangeRef.current(token);
          },
          'expired-callback': () => {
            if (cancelled) return;
            setStatus('loading');
            onTokenChangeRef.current(null);
          },
          'error-callback': () => {
            if (cancelled) return;
            setStatus('error');
            onTokenChangeRef.current(null);
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          onTokenChangeRef.current(null);
        }
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // Widget may already have been removed by the provider.
        }
      }
    };
  }, [siteKey, action]);

  return (
    <div className="space-y-2" aria-live="polite">
      <div ref={containerRef} aria-label="Verify you are human" />
      {status === 'loading' && siteKey && (
        <p className="text-xs text-muted-foreground" role="status">Loading Cloudflare verification…</p>
      )}
      {status === 'missing-key' && (
        <p className="text-xs text-destructive" role="alert">
          Cloudflare Turnstile is not configured. Authentication is disabled until verification is configured.
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-destructive" role="alert">
          Cloudflare verification failed to load. Check your connection, allow challenges.cloudflare.com, and retry.
        </p>
      )}
      {status === 'ready' && (
        <p className="text-xs text-muted-foreground" role="status">Verification complete.</p>
      )}
      <p className="text-xs text-muted-foreground">
        Protected by Cloudflare Turnstile.{' '}
        <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Privacy</a>
        {' · '}
        <a href="https://www.cloudflare.com/website-terms/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Terms</a>
      </p>
    </div>
  );
}

export default TurnstileCaptcha;
