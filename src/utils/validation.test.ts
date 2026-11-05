import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  encodeHTML, sanitizeHTML, validateEmail, validatePassword, validateUsername,
  sanitizeInput, sanitizeSearchQuery, validateTextLength, isValidUrl,
  isRateLimited, validateCSP,
} from './validation';

describe('validation and sanitization utilities', () => {
  it('HTML-encodes every dangerous character', () => {
    expect(encodeHTML(`&<>"'`=/`)).toBe('&amp;&lt;&gt;&quot;&#39;&#x60;&#x3D;&#x2F;');
  });

  it('removes script blocks, event handlers, styles and unsafe protocols', () => {
    const result = sanitizeHTML('<p onclick="x" style="color:red">safe</p><script>alert(1)</script><a href="javascript:run()">x</a>');
    expect(result).not.toMatch(/script|onclick|style|javascript:/i);
    expect(result).toContain('&lt;p');
  });

  it.each(['a@b.com', ' first.last+tag@sub.example.org '])('accepts valid email %s', (email) => {
    expect(validateEmail(email)).toBe(true);
  });
  it.each(['', 'a@', '@b.com', 'a@@b.com', 'a..b@domain.com', 'a@-bad.com', 'a@domain'])('rejects malformed email %s', (email) => {
    expect(validateEmail(email)).toBe(false);
  });

  it('enforces password length, composition and weak-pattern rules', () => {
    expect(validatePassword('')).toEqual({ isValid: false, message: 'Password is required' });
    expect(validatePassword('Ab1')).toMatchObject({ isValid: false });
    expect(validatePassword('Password123')).toMatchObject({ isValid: false, message: 'Password is too weak. Avoid common patterns.' });
    expect(validatePassword('Str0ng!Pass')).toEqual({ isValid: true });
    expect(validatePassword('A'.repeat(129))).toMatchObject({ isValid: false });
    expect(validatePassword('Abcdefgh')).toMatchObject({ isValid: false });
  });

  it('validates usernames and reserved names', () => {
    expect(validateUsername('reader_01')).toEqual({ isValid: true });
    expect(validateUsername('ab')).toMatchObject({ isValid: false });
    expect(validateUsername('a'.repeat(31))).toMatchObject({ isValid: false });
    expect(validateUsername('bad name')).toMatchObject({ isValid: false });
    expect(validateUsername('ADMIN')).toMatchObject({ isValid: false, message: 'This username is reserved' });
  });

  it('sanitizes bounded input and search terms', () => {
    expect(sanitizeInput('<b>hello</b>', 5)).toBe('hello');
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeSearchQuery('  hello  (world); "x"  ')).toBe('hello world x');
    expect(sanitizeSearchQuery('x'.repeat(120))).toHaveLength(100);
  });

  it('checks text length boundaries', () => {
    expect(validateTextLength('abc', 3, 5)).toEqual({ isValid: true });
    expect(validateTextLength('  ', 1, 5)).toMatchObject({ isValid: false });
    expect(validateTextLength('abcdef', 1, 5)).toMatchObject({ isValid: false });
  });

  it('allows public HTTP(S) URLs and rejects unsafe/private targets', () => {
    expect(isValidUrl('https://example.com/path')).toBe(true);
    expect(isValidUrl('http://example.com')).toBe(true);
    for (const url of ['javascript:alert(1)', 'ftp://example.com', 'http://localhost', 'http://127.0.0.1', 'http://192.168.1.2', 'http://10.0.0.1', 'http://172.16.0.1', 'not a url']) {
      expect(isValidUrl(url)).toBe(false);
    }
  });

  describe('local rate limiting', () => {
    beforeEach(() => {
      localStorage.clear();
      vi.spyOn(Date, 'now').mockReturnValue(1_000);
    });
    it('counts attempts and resets after the window', () => {
      expect(isRateLimited('login', 2, 100)).toBe(false);
      expect(isRateLimited('login', 2, 100)).toBe(false);
      expect(isRateLimited('login', 2, 100)).toBe(true);
      vi.spyOn(Date, 'now').mockReturnValue(1_101);
      expect(isRateLimited('login', 2, 100)).toBe(false);
    });
    it('fails open for malformed storage and blocked storage', () => {
      localStorage.setItem('rate_limit_bad', '{');
      expect(isRateLimited('bad', 1, 100)).toBe(false);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
      expect(isRateLimited('blocked', 1, 100)).toBe(false);
    });
  });

  it('rejects CSP-dangerous content and accepts safe text', () => {
    expect(validateCSP('<script>alert(1)</script>')).toBe(false);
    expect(validateCSP('javascript:alert(1)')).toBe(false);
    expect(validateCSP('<iframe src=x></iframe>')).toBe(false);
    expect(validateCSP('A safe article paragraph')).toBe(true);
  });
});
