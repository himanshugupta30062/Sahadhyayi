import { describe, expect, it } from 'vitest';
import { validateEmail, validatePassword, validateUsername, sanitizeInput, sanitizeSearchQuery, validateTextLength, isValidUrl, validateCSP, encodeHTML } from './validation';

describe('validation utilities edge cases', () => {
 it('encodes markup characters', () => { expect(encodeHTML('&<>')).toBe('&amp;&lt;&gt;'); });
 it.each(['x@y.com','reader+tag@sub.example.org'])('accepts email %s', x => expect(validateEmail(x)).toBe(true));
 it.each(['','@x.com','x@@y.com','x@bad'])('rejects email %s', x => expect(validateEmail(x)).toBe(false));
 it('validates strong and weak passwords', () => {
  expect(validatePassword('Str0ng!Pass').isValid).toBe(true);
  expect(validatePassword('Password123').isValid).toBe(false);
  expect(validatePassword('abc')).toMatchObject({isValid:false});
 });
 it('enforces username constraints', () => {
  expect(validateUsername('reader_01').isValid).toBe(true);
  expect(validateUsername('admin').isValid).toBe(false);
  expect(validateUsername('bad name').isValid).toBe(false);
 });
 it('bounds and normalizes user input', () => {
  expect(sanitizeInput('hello world',5)).toBe('hello');
  expect(sanitizeSearchQuery('  hello   world  ')).toBe('hello world');
  expect(sanitizeSearchQuery('x'.repeat(120))).toHaveLength(100);
 });
 it('checks text boundaries and public URLs', () => {
  expect(validateTextLength('abc',3,5).isValid).toBe(true);
  expect(validateTextLength('abcdef',1,5).isValid).toBe(false);
  expect(isValidUrl('https://example.com')).toBe(true);
  expect(isValidUrl('ftp://example.com')).toBe(false);
  expect(isValidUrl('http://localhost')).toBe(false);
 });
 it('checks CSP content', () => {
  expect(validateCSP('ordinary article text')).toBe(true);
  expect(validateCSP('script protocol')).toBe(false);
 });
});
