/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isRateLimited, isValidUrl, sanitizeInput, sanitizeSearchQuery,
  validateCSP, validateEmail, validatePassword, validateTextLength, validateUsername,
} from '@/utils/validation';

describe('validateEmail', () => {
  it.each(['reader@example.com', 'first.last+tag@sub.example.co.in', ' USER@EXAMPLE.COM '])(
    'accepts valid email %s', (value) => expect(validateEmail(value)).toBe(true),
  );
  it.each(['', 'plain-text', '@example.com', 'reader@', 'reader..dots@example.com', '.reader@example.com'])(
    'rejects invalid email %s', (value) => expect(validateEmail(value)).toBe(false),
  );
  it('rejects an address over the maximum length', () => {
    expect(validateEmail(`${'a'.repeat(243)}@example.com`)).toBe(false);
  });
});

describe('validatePassword', () => {
  it('requires a non-empty password', () => expect(validatePassword('')).toMatchObject({ isValid: false }));
  it('enforces minimum and maximum lengths', () => {
    expect(validatePassword('Ab1!')).toMatchObject({ isValid: false });
    expect(validatePassword('A'.repeat(129) + '1a')).toMatchObject({ isValid: false });
  });
  it.each(['lowercase1', 'UPPERCASE1', 'NoDigits!!', 'aaaB1234', 'password123A', '12345678Ab'])(
    'rejects weak password %s', (value) => expect(validatePassword(value).isValid).toBe(false),
  );
  it('accepts a strong password', () => expect(validatePassword('ReadBooks2026!')).toEqual({ isValid: true }));
});

describe('validateUsername', () => {
  it('checks presence, trims whitespace, and validates length', () => {
    expect(validateUsername('')).toMatchObject({ isValid: false });
    expect(validateUsername(' reader_01 ')).toEqual({ isValid: true });
    expect(validateUsername('ab')).toMatchObject({ isValid: false });
    expect(validateUsername('a'.repeat(31))).toMatchObject({ isValid: false });
  });
  it('accepts supported characters and rejects punctuation or spaces', () => {
    expect(validateUsername('reader-01_')).toEqual({ isValid: true });
    expect(validateUsername('reader.name')).toMatchObject({ isValid: false });
    expect(validateUsername('reader name')).toMatchObject({ isValid: false });
  });
  it.each(['admin', 'ROOT', 'User', 'guest', 'api', 'localhost'])(
    'blocks reserved name %s without case sensitivity', (value) =>
      expect(validateUsername(value)).toMatchObject({ isValid: false, message: 'This username is reserved' }),
  );
});

describe('sanitizeInput and sanitizeSearchQuery', () => {
  it('handles empty input and removes markup delimiters', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput('<hello>')).not.toContain('<');
  });
  it('trims and truncates input to the requested maximum length', () => {
    expect(sanitizeInput('  abcdef  ', 4)).toBe('abcd');
  });
  it('normalizes whitespace, removes query punctuation, and caps query length', () => {
    expect(sanitizeSearchQuery('  books   for (readers); "today"  ')).toBe('books for readers today');
    expect(sanitizeSearchQuery('x'.repeat(110))).toHaveLength(100);
  });
});

describe('validateTextLength', () => {
  it('rejects empty and whitespace-only values', () => {
    expect(validateTextLength('', 3, 10)).toMatchObject({ isValid: false });
    expect(validateTextLength('   ', 3, 10)).toMatchObject({ isValid: false });
  });
  it('accepts boundary lengths and rejects values outside them', () => {
    expect(validateTextLength('abc', 3, 5)).toEqual({ isValid: true });
    expect(validateTextLength('abcde', 3, 5)).toEqual({ isValid: true });
    expect(validateTextLength('ab', 3, 5)).toMatchObject({ isValid: false });
    expect(validateTextLength('abcdef', 3, 5)).toMatchObject({ isValid: false });
  });
});

describe('isValidUrl and validateCSP', () => {
  it('accepts public HTTP(S) addresses', () => {
    expect(isValidUrl('https://example.com/path')).toBe(true);
    expect(isValidUrl('http://example.org')).toBe(true);
  });
  it.each(['', 'not a url', 'file:///etc/passwd', 'http://localhost:3000', 'http://127.0.0.1', 'http://192.168.1.10', 'http://10.0.0.1'])(
    'rejects invalid or local address %s', (value) => expect(isValidUrl(value)).toBe(false),
  );
  it('accepts ordinary policy text and rejects dangerous markup indicators', () => {
    expect(validateCSP("default-src 'self'; img-src https:")).toBe(true);
    expect(validateCSP('<iframe src="x"></iframe>')).toBe(false);
    expect(validateCSP('onclick=run()')).toBe(false);
  });
});

describe('isRateLimited', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });
  it('allows the configured number of attempts and then limits', () => {
    expect(isRateLimited('signup', 2, 60_000)).toBe(false);
    expect(isRateLimited('signup', 2, 60_000)).toBe(false);
    expect(isRateLimited('signup', 2, 60_000)).toBe(true);
  });
  it('resets after the window expires', () => {
    isRateLimited('login', 1, 1_000);
    expect(isRateLimited('login', 1, 1_000)).toBe(true);
    vi.advanceTimersByTime(1_001);
    expect(isRateLimited('login', 1, 1_000)).toBe(false);
  });
  it('recovers from malformed stored data', () => {
    localStorage.setItem('rate_limit_test', '{bad json');
    expect(isRateLimited('test', 1, 60_000)).toBe(false);
  });
  it('fails open when browser storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage disabled'); });
    expect(isRateLimited('private-mode', 1, 60_000)).toBe(false);
  });
});
