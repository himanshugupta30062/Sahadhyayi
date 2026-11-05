// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import {
  _resetHcaptchaForTesting,
  getHcaptchaSiteKey,
  isHcaptchaConfigured,
  loadHcaptcha,
  HCAPTCHA_API_URL,
} from './hcaptcha';

describe('hcaptcha helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetHcaptchaForTesting();
    delete (window as any).hcaptcha;
    document.getElementById('hcaptcha-api-script')?.remove();
  });

  afterEach(() => {
    _resetHcaptchaForTesting();
    delete (window as any).hcaptcha;
    document.getElementById('hcaptcha-api-script')?.remove();
  });

  it('detects when hCaptcha site key is configured or absent', () => {
    const originalEnv = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

    vi.stubEnv('VITE_HCAPTCHA_SITE_KEY', '  415cd332-85f0-4028-b828-8d1a36000818  ');
    expect(getHcaptchaSiteKey()).toBe('415cd332-85f0-4028-b828-8d1a36000818');
    expect(isHcaptchaConfigured()).toBe(true);

    vi.stubEnv('VITE_HCAPTCHA_SITE_KEY', '');
    expect(getHcaptchaSiteKey()).toBeUndefined();
    expect(isHcaptchaConfigured()).toBe(false);

    if (originalEnv !== undefined) {
      vi.stubEnv('VITE_HCAPTCHA_SITE_KEY', originalEnv);
    }
  });

  it('loads the hCaptcha script when not already present in DOM', async () => {
    const loadPromise = loadHcaptcha();

    const script = document.getElementById('hcaptcha-api-script') as HTMLScriptElement;
    expect(script).toBeInTheDocument();
    expect(script.src).toBe(HCAPTCHA_API_URL);

    (window as any).hcaptcha = {
      render: vi.fn(),
      reset: vi.fn(),
      remove: vi.fn(),
    };
    script.dispatchEvent(new Event('load'));

    await expect(loadPromise).resolves.toBeUndefined();
  });

  it('resolves immediately if window.hcaptcha already exists', async () => {
    (window as any).hcaptcha = {
      render: vi.fn(),
    };

    await expect(loadHcaptcha()).resolves.toBeUndefined();
    expect(document.getElementById('hcaptcha-api-script')).toBeNull();
  });

  it('attaches to an existing script element in DOM', async () => {
    const existingScript = document.createElement('script');
    existingScript.id = 'hcaptcha-api-script';
    document.head.appendChild(existingScript);

    const loadPromise = loadHcaptcha();

    (window as any).hcaptcha = {
      render: vi.fn(),
    };
    existingScript.dispatchEvent(new Event('load'));

    await expect(loadPromise).resolves.toBeUndefined();
  });

  it('rejects if script loads without defining window.hcaptcha', async () => {
    const loadPromise = loadHcaptcha();
    const script = document.getElementById('hcaptcha-api-script') as HTMLScriptElement;

    script.dispatchEvent(new Event('load'));
    await expect(loadPromise).rejects.toThrow('hCaptcha loaded without its API.');
  });

  it('rejects when script loading encounters a network error', async () => {
    const loadPromise = loadHcaptcha();
    const script = document.getElementById('hcaptcha-api-script') as HTMLScriptElement;

    script.dispatchEvent(new Event('error'));
    await expect(loadPromise).rejects.toThrow('Could not load hCaptcha service.');
  });
});
