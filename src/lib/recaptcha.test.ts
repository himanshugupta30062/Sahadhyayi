/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import {
  executeRecaptcha,
  isRecaptchaConfigured,
  getRecaptchaSiteKey,
  isRecaptchaEnterprise,
  loadRecaptcha,
  initRecaptcha,
  _resetRecaptchaForTesting,
} from './recaptcha';

describe('Google reCAPTCHA Enterprise helper (recaptcha.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as any).grecaptcha;
    _resetRecaptchaForTesting();
    document.getElementById('google-recaptcha-script')?.remove();
    document.getElementById('google-recaptcha-v3')?.remove();
  });

  afterEach(() => {
    delete (window as any).grecaptcha;
    _resetRecaptchaForTesting();
    document.getElementById('google-recaptcha-script')?.remove();
    document.getElementById('google-recaptcha-v3')?.remove();
  });

  it('reports configuration state correctly', () => {
    expect(typeof isRecaptchaConfigured()).toBe('boolean');
    expect(isRecaptchaEnterprise()).toBe(true);
    expect(getRecaptchaSiteKey() === undefined || typeof getRecaptchaSiteKey() === 'string').toBe(true);
  });

  it('rejects invalid action names with invalid characters', async () => {
    await expect(executeRecaptcha('')).rejects.toThrow('Invalid reCAPTCHA action');
    await expect(executeRecaptcha('invalid action with spaces')).rejects.toThrow('Invalid reCAPTCHA action');
    await expect(executeRecaptcha('<script>alert(1)</script>')).rejects.toThrow('Invalid reCAPTCHA action');
  });

  it('executes via window.grecaptcha.enterprise when Enterprise API is loaded', async () => {
    const mockExecute = vi.fn().mockResolvedValue('enterprise-score-token-xyz');
    const mockReady = vi.fn((cb: () => void) => cb());

    (window as any).grecaptcha = {
      enterprise: {
        ready: mockReady,
        execute: mockExecute,
      },
    };

    const token = await executeRecaptcha('signin');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('executes via fallback window.grecaptcha when standard v3 API is loaded', async () => {
    const mockExecute = vi.fn().mockResolvedValue('standard-v3-token-abc');
    const mockReady = vi.fn((cb: () => void) => cb());

    (window as any).grecaptcha = {
      ready: mockReady,
      execute: mockExecute,
    };

    const token = await executeRecaptcha('signup');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('initRecaptcha does not throw in browser environment', () => {
    expect(() => initRecaptcha()).not.toThrow();
  });

  it('loadRecaptcha resolves immediately if grecaptcha is already defined', async () => {
    (window as any).grecaptcha = {
      enterprise: {
        ready: vi.fn(),
        execute: vi.fn(),
      },
    };
    await expect(loadRecaptcha()).resolves.toBeUndefined();
  });

  it('creates script element and resolves when load event fires and grecaptcha attaches', async () => {
    const loadPromise = loadRecaptcha();
    const script = document.getElementById('google-recaptcha-script') as HTMLScriptElement;
    expect(script).toBeInTheDocument();
    expect(script.src).toContain('https://www.google.com/recaptcha/enterprise.js');

    (window as any).grecaptcha = {
      enterprise: {
        ready: vi.fn(),
        execute: vi.fn(),
      },
    };

    script.dispatchEvent(new Event('load'));
    await expect(loadPromise).resolves.toBeUndefined();
  });

  it('handles existing script element and completes on load', async () => {
    const existing = document.createElement('script');
    existing.id = 'google-recaptcha-script';
    document.head.appendChild(existing);

    const loadPromise = loadRecaptcha();

    (window as any).grecaptcha = {
      enterprise: {
        ready: vi.fn(),
        execute: vi.fn(),
      },
    };

    existing.dispatchEvent(new Event('load'));
    await expect(loadPromise).resolves.toBeUndefined();
  });

  it('rejects when script loading triggers an error', async () => {
    const loadPromise = loadRecaptcha();
    const script = document.getElementById('google-recaptcha-script') as HTMLScriptElement;
    expect(script).toBeInTheDocument();

    script.dispatchEvent(new Event('error'));
    await expect(loadPromise).rejects.toThrow('Unable to load Google reCAPTCHA');
  });
});
