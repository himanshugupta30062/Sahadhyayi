import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useCallback, useState } from 'react';

type HCaptchaWidgetProps = {
  onTokenChange: (token: string | null) => void;
  action: 'signin' | 'signup' | 'password_reset' | string;
};

/** hCaptcha widget used to obtain Supabase-compatible CAPTCHA tokens. */
export function HCaptchaWidget({ onTokenChange }: HCaptchaWidgetProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing-key'>('loading');
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY?.trim();

  const handleVerify = useCallback((token: string) => {
    setStatus('ready');
    onTokenChange(token);
  }, [onTokenChange]);

  const handleExpire = useCallback(() => {
    setStatus('loading');
    onTokenChange(null);
  }, [onTokenChange]);

  const handleError = useCallback((error: string) => {
    setStatus('error');
    onTokenChange(null);
    // hCaptcha exposes provider errors as a string; avoid logging tokens.
    console.error('hCaptcha verification error:', error);
  }, [onTokenChange]);

  if (!siteKey) {
    return (
      <p className="text-xs text-destructive" role="alert">
        hCaptcha is not configured. Authentication is disabled until verification is configured.
      </p>
    );
  }

  return (
    <div className="space-y-2" aria-live="polite">
      <HCaptcha
        sitekey={siteKey}
        onVerify={handleVerify}
        onExpire={handleExpire}
        onError={handleError}
        onLoad={() => setStatus('loading')}
        reCaptchaCompat={false}
        languageOverride="en"
        size="normal"
      />
      {status === 'loading' && (
        <p className="text-xs text-muted-foreground" role="status">Complete the hCaptcha challenge…</p>
      )}
      {status === 'ready' && (
        <p className="text-xs text-muted-foreground" role="status">Verification complete.</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-destructive" role="alert">
          hCaptcha verification failed. Please retry the challenge.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Protected by hCaptcha.{' '}
        <a href="https://www.hcaptcha.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Privacy</a>
        {' · '}
        <a href="https://www.hcaptcha.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Terms</a>
      </p>
    </div>
  );
}

export default HCaptchaWidget;
