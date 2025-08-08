import { describe, it, expect } from 'vitest';
import { sanitizeHTML, validateEmail } from './validation';

describe('validation utils', () => {
  it('sanitizes html', () => {
    const dirty = '<script>alert(1)</script><div>ok</div>';
    expect(sanitizeHTML(dirty)).not.toContain('script');
  });

  it('validates emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('bad-email')).toBe(false);
  });
});
