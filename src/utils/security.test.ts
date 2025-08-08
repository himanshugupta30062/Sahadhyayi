import { describe, it, expect } from 'vitest';
import { generateCSRFToken, setCSRFToken, validateCSRFToken } from './security';

describe('security utils', () => {
  it('generates and validates csrf token', () => {
    const token = generateCSRFToken();
    setCSRFToken(token);
    expect(validateCSRFToken(token)).toBe(true);
    expect(validateCSRFToken('bad')).toBe(false);
  });
});
