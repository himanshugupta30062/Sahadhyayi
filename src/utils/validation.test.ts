import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  validateEmail, validatePassword, validateUsername, sanitizeInput,
  sanitizeSearchQuery, validateTextLength, isValidUrl, validateCSP,
  encodeHTML, sanitizeHTML, isRateLimited,
} from './validation';

describe('validation utilities edge cases', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('encodes markup characters', () => {
    expect(encodeHTML('&<>')).toBe('&amp;&lt;&gt;');
    expect(encodeHTML('"\'=/')).toBe('&#x3D;&quot;&#39;&#x2F;');
    expect(encodeHTML('plain text')).toBe('plain text');
  });

  it.each(['x@y.com', 'reader+tag@sub.example.org'])('accepts email %s', value => expect(validateEmail(value)).toBe(true));
  it.each(['', '@x.com', 'x@@y.com', 'x@bad', '.x@y.com', 'x..y@domain.com', 'x@y-.com'])(
    'rejects malformed email %s', value => expect(validateEmail(value)).toBe(false),
  );

  it('validates strong and weak passwords and exact length limits', () => {
    expect(validatePassword('Str0ng!Pass').isValid).toBe(true);
    expect(validatePassword('Password123').isValid).toBe(false);
    expect(validatePassword('abc')).toMatchObject({ isValid: false });
    expect(validatePassword('Abc12345').isValid).toBe(true);
    expect(validatePassword('Abc12345'.repeat(17))).toMatchObject({ isValid: false });
  });

  it('enforces username constraints and reserved names case-insensitively', () => {
    expect(validateUsername('reader_01').isValid).toBe(true);
    expect(validateUsername('admin').isValid).toBe(false);
    expect(validateUsername('ADMIN').isValid).toBe(false);
    expect(validateUsername('bad name').isValid).toBe(false);
    expect(validateUsername('ab').isValid).toBe(false);
    expect(validateUsername('a'.repeat(31)).isValid).toBe(false);
  });

  it('bounds and normalizes user input', () => {
    expect(sanitizeInput('hello world', 5)).toBe('hello');
    expect(sanitizeInput('  hello  ')).toBe('hello');
    expect(sanitizeSearchQuery('  hello   world  ')).toBe('hello world');
    expect(sanitizeSearchQuery('x'.repeat(120))).toHaveLength(100);
    expect(sanitizeSearchQuery('a;b(c)')).toBe('abc');
    expect(sanitizeSearchQuery('')).toBe('');
  });

  it('sanitizes script blocks and unsafe attributes before encoding', () => {
    expect(sanitizeHTML('safe text')).toBe('safe text');
    expect(sanitizeHTML('before<script>bad()</script>after')).toBe('beforeafter');
    expect(sanitizeHTML('before<script')).toBe('before');
    expect(sanitizeHTML('safe & text')).toBe('safe &amp; text');
    expect(sanitizeHTML('data:text/html;payload;')).not.toContain('data:text/html');
  });

  it('checks text boundaries and public URLs', () => {
    expect(validateTextLength('abc', 3, 5).isValid).toBe(true);
    expect(validateTextLength('abcdef', 1, 5).isValid).toBe(false);
    expect(validateTextLength('  ', 1, 5).isValid).toBe(false);
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('http://localhost')).toBe(false);
    expect(isValidUrl('http://172.31.0.1')).toBe(false);
    expect(isValidUrl('not a url')).toBe(false);
  });

  it('checks CSP content', () => {
    expect(validateCSP('ordinary article text')).toBe(true);
    expect(validateCSP('script protocol')).toBe(true);
    expect(validateCSP('javascript:')).toBe(false);
    expect(validateCSP('<iframe')).toBe(false);
  });

  it('tracks attempts and resets after the time window', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    expect(isRateLimited('signup', 2, 500)).toBe(false);
    expect(isRateLimited('signup', 2, 500)).toBe(false);
    expect(isRateLimited('signup', 2, 500)).toBe(true);
    vi.spyOn(Date, 'now').mockReturnValue(1_501);
    expect(isRateLimited('signup', 2, 500)).toBe(false);
    expect(JSON.parse(localStorage.getItem('rate_limit_signup') || '{}')).toMatchObject({ count: 1, firstAttempt: 1501 });
  });

  it('recovers from malformed stored limiter data', () => {
    localStorage.setItem('rate_limit_broken', '{invalid');
    vi.spyOn(Date, 'now').mockReturnValue(42);
    expect(isRateLimited('broken', 1, 100)).toBe(false);
    expect(JSON.parse(localStorage.getItem('rate_limit_broken') || '{}')).toMatchObject({ count: 1, firstAttempt: 42 });
  });
});
