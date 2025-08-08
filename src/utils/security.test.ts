import { describe, it, expect } from "vitest";
import { generateCSRFToken, setCSRFToken, validateCSRFToken } from './security';

describe('security utils', () => {
  it('generates a 64-character token', () => {
    const token = generateCSRFToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('validates stored CSRF tokens', () => {
    const token = 'test-token';
    setCSRFToken(token);
    expect(validateCSRFToken(token)).toBe(true);
    expect(validateCSRFToken('other')).toBe(false);
  });
});
