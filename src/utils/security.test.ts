// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.unmock('@/utils/security');
vi.unmock('@/utils/security.ts');
import {
  clearCSRFToken,
  createSecureHeaders,
  generateCSRFToken,
  getCSRFToken,
  getSafeRedirectUrl,
  initializeSecurity,
  initializeSecureSession,
  setCSRFToken,
  validateFileUpload,
} from './security.ts';

describe('client security utilities', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.cookie = 'csrfToken=; Path=/; Max-Age=0';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates a non-empty CSRF token using secure browser randomness', () => {
    const token = generateCSRFToken();

    expect(token).toBeTruthy();
    expect(token).not.toContain('=');
    expect(token.length).toBeGreaterThan(20);
  });

  it('stores, reads, and clears the CSRF token', () => {
    setCSRFToken('test-token');

    expect(sessionStorage.getItem('csrfToken')).toBe('test-token');
    expect(getCSRFToken()).toBe('test-token');

    clearCSRFToken();

    expect(sessionStorage.getItem('csrfToken')).toBeNull();
    expect(getCSRFToken()).toBeNull();
  });

  it('falls back to the cookie when session storage has no token', () => {
    document.cookie = 'csrfToken=cookie-token; Path=/; SameSite=Strict';

    expect(getCSRFToken()).toBe('cookie-token');
  });

  it('round-trips cookie tokens containing reserved characters', () => {
    setCSRFToken('token;with spaces%');

    expect(getCSRFToken()).toBe('token;with spaces%');
  });

  it('ignores malformed encoded cookie tokens without throwing', () => {
    sessionStorage.removeItem('csrfToken');
    document.cookie = 'csrfToken=%E0%A4%A; Path=/; SameSite=Strict';

    expect(() => getCSRFToken()).not.toThrow();
    expect(getCSRFToken()).toBeNull();
  });

  it('creates JSON request headers and optionally adds the CSRF header', () => {
    setCSRFToken('header-token');

    expect(createSecureHeaders()).toMatchObject({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': 'header-token',
    });
    expect(createSecureHeaders(false)).not.toHaveProperty('X-CSRF-Token');
  });

  it('initializes a session token only when one is missing', () => {
    const setToken = vi.spyOn(Math, 'random');

    initializeSecureSession();
    expect(getCSRFToken()).toBeTruthy();

    setCSRFToken('existing-token');
    initializeSecureSession();
    expect(getCSRFToken()).toBe('existing-token');

    initializeSecurity();
    expect(getCSRFToken()).toBe('existing-token');
    expect(setToken).not.toHaveBeenCalled();
  });

  it('rejects absent files, oversized files, disallowed MIME types, and mismatched extensions', () => {
    expect(validateFileUpload(null as unknown as File)).toMatchObject({
      valid: false,
      error: 'No file provided',
    });

    const oversized = new File(['large'], 'large.png', { type: 'image/png' });
    Object.defineProperty(oversized, 'size', { value: 10 });
    expect(validateFileUpload(oversized, ['image/png'], 5).valid).toBe(false);

    const wrongType = new File(['data'], 'notes.txt', { type: 'text/plain' });
    expect(validateFileUpload(wrongType, ['image/png']).error).toBe('File type not allowed');

    const mismatch = new File(['data'], 'picture.txt', { type: 'image/png' });
    expect(validateFileUpload(mismatch).error).toBe('File extension does not match content type');
  });

  it('accepts valid files and permits unlisted MIME types when no allow-list is supplied', () => {
    const png = new File(['image'], 'cover.png', { type: 'image/png' });
    const custom = new File(['data'], 'payload.bin', { type: 'application/octet-stream' });

    expect(validateFileUpload(png, ['image/png']).valid).toBe(true);
    expect(validateFileUpload(custom).valid).toBe(true);
  });

  it.each([
    [null, '/dashboard'],
    ['', '/dashboard'],
    ['https://evil.example', '/dashboard'],
    ['//evil.example/path', '/dashboard'],
    ['/\\\\evil.example', '/dashboard'],
    ['javascript:alert(1)', '/dashboard'],
    ['data:text/html,evil', '/dashboard'],
    ['/library?tab=read', '/library?tab=read'],
    ['  /authors  ', '/authors'],
  ])('validates redirect target %s', (target, expected) => {
    expect(getSafeRedirectUrl(target as string | null)).toBe(expected);
  });

  it('supports a caller-supplied default redirect', () => {
    expect(getSafeRedirectUrl('https://evil.example', '/signin')).toBe('/signin');
  });
});
