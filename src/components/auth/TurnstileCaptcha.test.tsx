/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { TurnstileCaptcha } from './TurnstileCaptcha';
import * as recaptchaLib from '@/lib/recaptcha';

describe('TurnstileCaptcha component', () => {
  const onTokenChange = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    onTokenChange.mockClear();
    delete (window as any).turnstile;
    document.getElementById('cloudflare-turnstile-api')?.remove();
  });

  afterEach(() => {
    cleanup();
    delete (window as any).turnstile;
    document.getElementById('cloudflare-turnstile-api')?.remove();
  });

  it('renders Google reCAPTCHA disclosure and activates token when reCAPTCHA is configured', () => {
    vi.spyOn(recaptchaLib, 'isRecaptchaConfigured').mockReturnValue(true);

    render(<TurnstileCaptcha onTokenChange={onTokenChange} action="signin" />);

    expect(screen.getByText(/Protected by Google reCAPTCHA/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', 'https://policies.google.com/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', 'https://policies.google.com/terms');
    expect(onTokenChange).toHaveBeenCalledWith('recaptcha-active');
  });

  it('renders missing-key error in production when neither service is configured', () => {
    vi.spyOn(recaptchaLib, 'isRecaptchaConfigured').mockReturnValue(false);
    const origDev = import.meta.env.DEV;
    (import.meta.env as any).DEV = false;

    render(<TurnstileCaptcha onTokenChange={onTokenChange} action="signin" />);

    expect(screen.getByRole('alert')).toHaveTextContent(/Sign-in verification is not configured yet/i);
    expect(onTokenChange).toHaveBeenCalledWith(null);

    (import.meta.env as any).DEV = origDev;
  });

  it('bypasses in dev mode with dev-bypass-token when keys are missing', () => {
    vi.spyOn(recaptchaLib, 'isRecaptchaConfigured').mockReturnValue(false);
    const origDev = import.meta.env.DEV;
    (import.meta.env as any).DEV = true;

    render(<TurnstileCaptcha onTokenChange={onTokenChange} action="signup" />);

    expect(onTokenChange).toHaveBeenCalledWith('dev-bypass-token');

    (import.meta.env as any).DEV = origDev;
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

  it('handles dynamic script insertion and script load error', async () => {
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
});

