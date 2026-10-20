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
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const scriptId = 'cloudflare-turnstile-api';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const onLoad = () => {
      if (window.turnstile) resolve();
      else reject(new Error('Turnstile loaded without its API.'));
    };
    const onError = () => reject(new Error('Could not load the verification service.'));

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      document.head.appendChild(script);
      return;
    }

    if (window.turnstile) {
      resolve();
      return;
    }

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
  }).catch((error: unknown) => {
    turnstileScriptPromise = null;
    throw error;
  });

  return turnstileScriptPromise;
}

type TurnstileCaptchaProps = {
  onTokenChange: (token: string | null) => void;
};

/**
 * Turnstile is intentionally fail-closed: without a public site key or a
 * successful challenge, the signup forms cannot submit. The matching secret
 * must also be configured in Supabase Auth > Bot and Abuse Protection.
 */
export function TurnstileCaptcha({ onTokenChange }: TurnstileCaptchaProps) {
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
          action: 'signup',
          theme: 'auto',
          callback: (token) => {
            if (cancelled) return;
            setStatus('ready');
            onTokenChangeRef.current(token);
          },
          'expired-callback': () => {
            if (cancelled) return;
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
          // Ignore cleanup errors when the third-party widget was already removed.
        }
      }
    };
  }, [siteKey]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} aria-label="Verify you are human" />
      {status === 'loading' && siteKey && (
        <p className="text-xs text-muted-foreground" role="status">Loading signup verification…</p>
      )}
      {status === 'missing-key' && (
        <p className="text-xs text-destructive" role="alert">
          Signup verification is not configured yet. Please try again later.
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-destructive" role="alert">
          Verification could not load or failed. Check your connection and try again.
        </p>
      )}
      {status === 'ready' && (
        <p className="text-xs text-muted-foreground">Verification complete.</p>
      )}
    </div>
  );
}

export default TurnstileCaptcha;
