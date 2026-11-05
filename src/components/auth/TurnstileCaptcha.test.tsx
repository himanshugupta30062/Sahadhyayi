/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { TurnstileCaptcha } from './TurnstileCaptcha';
import * as recaptchaLib from '@/lib/recaptcha';
import * as hcaptchaLib from '@/lib/hcaptcha';

describe('TurnstileCaptcha component', () => {
  const onTokenChange = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    onTokenChange.mockClear();
    hcaptchaLib._resetHcaptchaForTesting();
    delete (window as any).turnstile;
    delete (window as any).hcaptcha;
    document.getElementById('cloudflare-turnstile-api')?.remove();
    document.getElementById('hcaptcha-api-script')?.remove();

    // Default: hCaptcha disabled unless explicit test enables it
    vi.spyOn(hcaptchaLib, 'getHcaptchaSiteKey').mockReturnValue(undefined);
    vi.spyOn(hcaptchaLib, 'isHcaptchaConfigured').mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    delete (window as any).turnstile;
    delete (window as any).hcaptcha;
    document.getElementById('cloudflare-turnstile-api')?.remove();
    document.getElementById('hcaptcha-api-script')?.remove();
    hcaptchaLib._resetHcaptchaForTesting();
  });

  it('renders Google reCAPTCHA disclosure and activates token when reCAPTCHA is configured and hCaptcha is inactive', () => {
    vi.spyOn(recaptchaLib, 'isRecaptchaConfigured').mockReturnValue(true);

    render(<TurnstileCaptcha onTokenChange={onTokenChange} action="signin" />);

    expect(screen.getByText(/Protected by Google reCAPTCHA/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', 'https://policies.google.com/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', 'https://policies.google.com/terms');
    expect(onTokenChange).toHaveBeenCalledWith('recaptcha-active');
  });

  it('renders missing-key error in production when no service is configured', () => {
    vi.spyOn(recaptchaLib, 'isRecaptchaConfigured').mockReturnValue(false);
    const origDev = import.meta.env.DEV;
    const origTurnstile = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    (import.meta.env as any).DEV = false;
    (import.meta.env as any).VITE_TURNSTILE_SITE_KEY = '';

    render(<TurnstileCaptcha onTokenChange={onTokenChange} action="signin" />);

    expect(screen.getByRole('alert')).toHaveTextContent(/Sign-in verification is not configured yet/i);
    expect(onTokenChange).toHaveBeenCalledWith(null);

    (import.meta.env as any).DEV = origDev;
    (import.meta.env as any).VITE_TURNSTILE_SITE_KEY = origTurnstile;
  });

  it('bypasses in dev mode with dev-bypass-token when keys are missing', () => {
    vi.spyOn(recaptchaLib, 'isRecaptchaConfigured').mockReturnValue(false);
    const origDev = import.meta.env.DEV;
    const origTurnstile = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    (import.meta.env as any).DEV = true;
    (import.meta.env as any).VITE_TURNSTILE_SITE_KEY = '';

    render(<TurnstileCaptcha onTokenChange={onTokenChange} action="signup" />);

    expect(onTokenChange).toHaveBeenCalledWith('dev-bypass-token');

    (import.meta.env as any).DEV = origDev;
    (import.meta.env as any).VITE_TURNSTILE_SITE_KEY = origTurnstile;
  });

  it('renders and binds Turnstile callbacks when turnstile site key and API are present', async () => {
    vi.spyOn(recaptchaLib, 'isRecaptchaConfigured').mockReturnValue(false);
    const origSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    (import.meta.env as any).VITE_TURNSTILE_SITE_KEY = 'test-turnstile-key';

    let capturedOptions: any;
    const mockRemove = vi.fn();
    (window as any).turnstile = {
      render: vi.fn((_container, options) => {
        capturedOptions = options;
        return 'widget-123';
      }),
      remove: mockRemove,
      reset: vi.fn(),
    };

    const { unmount } = render(<TurnstileCaptcha onTokenChange={onTokenChange} action="signin" />);

    await waitFor(() => {
      expect((window as any).turnstile.render).toHaveBeenCalled();
    });

    // Simulate successful challenge solve
    await act(async () => {
      capturedOptions.callback('verified-turnstile-token');
    });
    expect(onTokenChange).toHaveBeenCalledWith('verified-turnstile-token');
    expect(screen.getByText('Verification complete.')).toBeInTheDocument();

    // Simulate expired token
    await act(async () => {
      capturedOptions['expired-callback']();
    });
    expect(onTokenChange).toHaveBeenCalledWith(null);

    // Simulate challenge error
    await act(async () => {
      capturedOptions['error-callback']();
    });
    expect(onTokenChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(/Verification could not load or failed/i);

    unmount();
    expect(mockRemove).toHaveBeenCalledWith('widget-123');

    (import.meta.env as any).VITE_TURNSTILE_SITE_KEY = origSiteKey;
  });

  it('handles dynamic Turnstile script insertion and script load error', async () => {
    vi.spyOn(recaptchaLib, 'isRecaptchaConfigured').mockReturnValue(false);
    const origSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    (import.meta.env as any).VITE_TURNSTILE_SITE_KEY = 'test-turnstile-key';

    render(<TurnstileCaptcha onTokenChange={onTokenChange} action="signup" />);

    const script = document.getElementById('cloudflare-turnstile-api') as HTMLScriptElement;
    expect(script).toBeInTheDocument();

    // Simulate script loading error
    await act(async () => {
      script.dispatchEvent(new Event('error'));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/Verification could not load or failed/i);

    (import.meta.env as any).VITE_TURNSTILE_SITE_KEY = origSiteKey;
  });

  it('renders and binds hCaptcha when hCaptcha site key and API are present', async () => {
    vi.spyOn(hcaptchaLib, 'getHcaptchaSiteKey').mockReturnValue('415cd332-85f0-4028-b828-8d1a36000818');
    vi.spyOn(hcaptchaLib, 'isHcaptchaConfigured').mockReturnValue(true);

    let capturedOptions: any;
    const mockRemove = vi.fn();
    (window as any).hcaptcha = {
      render: vi.fn((_container, options) => {
        capturedOptions = options;
        return 'hcap-widget-99';
      }),
      remove: mockRemove,
      reset: vi.fn(),
      execute: vi.fn(),
      getResponse: vi.fn(),
    };

    const { unmount } = render(<TurnstileCaptcha onTokenChange={onTokenChange} action="signin" />);

    await waitFor(() => {
      expect((window as any).hcaptcha.render).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          sitekey: '415cd332-85f0-4028-b828-8d1a36000818',
          theme: 'auto',
        })
      );
    });

    // Simulate successful hCaptcha token
    await act(async () => {
      capturedOptions.callback('hcaptcha-user-response-token');
    });
    expect(onTokenChange).toHaveBeenCalledWith('hcaptcha-user-response-token');
    expect(screen.getByText('Verification complete.')).toBeInTheDocument();

    // Simulate token expiration
    await act(async () => {
      capturedOptions['expired-callback']();
    });
    expect(onTokenChange).toHaveBeenCalledWith(null);

    // Simulate hCaptcha error
    await act(async () => {
      capturedOptions['error-callback']();
    });
    expect(onTokenChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(/Verification could not load or failed/i);

    unmount();
    expect(mockRemove).toHaveBeenCalledWith('hcap-widget-99');
  });

  it('handles dynamic hCaptcha script insertion and script load error', async () => {
    vi.spyOn(hcaptchaLib, 'getHcaptchaSiteKey').mockReturnValue('415cd332-85f0-4028-b828-8d1a36000818');
    vi.spyOn(hcaptchaLib, 'isHcaptchaConfigured').mockReturnValue(true);

    render(<TurnstileCaptcha onTokenChange={onTokenChange} action="signup" />);

    const script = document.getElementById('hcaptcha-api-script') as HTMLScriptElement;
    expect(script).toBeInTheDocument();

    await act(async () => {
      script.dispatchEvent(new Event('error'));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/Verification could not load or failed/i);
    expect(onTokenChange).toHaveBeenCalledWith(null);
  });
});


