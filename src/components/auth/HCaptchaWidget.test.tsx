/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { HCaptchaWidget } from './HCaptchaWidget';

// Mock @hcaptcha/react-hcaptcha component
let capturedProps: any = null;
vi.mock('@hcaptcha/react-hcaptcha', () => ({
  default: (props: any) => {
    capturedProps = props;
    return (
      <div data-testid="hcaptcha-mock">
        <button type="button" onClick={() => props.onVerify('mock-hcaptcha-token')}>Verify</button>
        <button type="button" onClick={() => props.onExpire()}>Expire</button>
        <button type="button" onClick={() => props.onError('mock-error')}>Error</button>
      </div>
    );
  },
}));

describe('HCaptchaWidget component', () => {
  const onTokenChange = vi.fn();
  const origKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    onTokenChange.mockClear();
    capturedProps = null;
    (import.meta.env as any).VITE_HCAPTCHA_SITE_KEY = 'test-hcaptcha-sitekey';
  });

  afterEach(() => {
    cleanup();
    (import.meta.env as any).VITE_HCAPTCHA_SITE_KEY = origKey;
  });

  it('renders disabled alert when VITE_HCAPTCHA_SITE_KEY is not configured', () => {
    (import.meta.env as any).VITE_HCAPTCHA_SITE_KEY = '';

    render(<HCaptchaWidget onTokenChange={onTokenChange} action="signin" />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'hCaptcha is not configured. Authentication is disabled until verification is configured.'
    );
    expect(screen.queryByTestId('hcaptcha-mock')).not.toBeInTheDocument();
  });

  it('renders HCaptcha and passes sitekey and options when configured', () => {
    render(<HCaptchaWidget onTokenChange={onTokenChange} action="signin" />);

    expect(screen.getByTestId('hcaptcha-mock')).toBeInTheDocument();
    expect(capturedProps.sitekey).toBe('test-hcaptcha-sitekey');
    expect(capturedProps.size).toBe('normal');
    expect(capturedProps.languageOverride).toBe('en');

    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      'https://www.hcaptcha.com/privacy'
    );
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      'https://www.hcaptcha.com/terms'
    );
  });

  it('handles verification success token callback', async () => {
    render(<HCaptchaWidget onTokenChange={onTokenChange} action="signup" />);

    await act(async () => {
      capturedProps.onVerify('test-verified-token');
    });

    expect(onTokenChange).toHaveBeenCalledWith('test-verified-token');
    expect(screen.getByText('Verification complete.')).toBeInTheDocument();
  });

  it('handles token expiration callback', async () => {
    render(<HCaptchaWidget onTokenChange={onTokenChange} action="signin" />);

    await act(async () => {
      capturedProps.onExpire();
    });

    expect(onTokenChange).toHaveBeenCalledWith(null);
    expect(screen.getByText('Complete the hCaptcha challenge…')).toBeInTheDocument();
  });

  it('handles challenge error callback and logs error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<HCaptchaWidget onTokenChange={onTokenChange} action="signin" />);

    await act(async () => {
      capturedProps.onError('rate-limited');
    });

    expect(onTokenChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'hCaptcha verification failed. Please retry the challenge.'
    );
    expect(consoleSpy).toHaveBeenCalledWith('hCaptcha verification error:', 'rate-limited');
  });

  it('updates status to loading when onLoad is triggered', async () => {
    render(<HCaptchaWidget onTokenChange={onTokenChange} action="signin" />);

    await act(async () => {
      capturedProps.onLoad();
    });

    expect(screen.getByText('Complete the hCaptcha challenge…')).toBeInTheDocument();
  });
});

