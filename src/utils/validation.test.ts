import { describe, it, expect } from "vitest";
import { sanitizeHTML, validateEmail, isValidUrl } from './validation';

describe('validation utils', () => {
  it('sanitizes html input', () => {
    const dirty = '<script>alert(1)</script><div>safe</div>';
    const clean = sanitizeHTML(dirty);
    expect(clean).not.toContain('script');
    expect(clean).toContain('safe');
  });

  it('validates email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('bad..email')).toBe(false);
  });

  it('checks url validity', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });
});
