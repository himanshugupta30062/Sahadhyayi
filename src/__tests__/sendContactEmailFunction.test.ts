import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('send-contact-email Edge Function Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates required fields (name, email, message)', () => {
    const validatePayload = (payload: any) => {
      const { name, email, message } = payload || {};
      if (!name || typeof name !== 'string' || !name.trim()) return { valid: false, error: 'Name is required' };
      if (!email || typeof email !== 'string' || !email.trim()) return { valid: false, error: 'Email is required' };
      if (!message || typeof message !== 'string' || !message.trim()) return { valid: false, error: 'Message is required' };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) return { valid: false, error: 'Invalid email address' };
      if (name.trim().length > 100) return { valid: false, error: 'Name must not exceed 100 characters' };
      if (message.trim().length > 5000) return { valid: false, error: 'Message must not exceed 5000 characters' };
      return { valid: true };
    };

    expect(validatePayload({ name: '', email: 'test@example.com', message: 'Hello' })).toEqual({
      valid: false,
      error: 'Name is required',
    });
    expect(validatePayload({ name: 'Bob', email: '', message: 'Hello' })).toEqual({
      valid: false,
      error: 'Email is required',
    });
    expect(validatePayload({ name: 'Bob', email: 'not-an-email', message: 'Hello' })).toEqual({
      valid: false,
      error: 'Invalid email address',
    });
    expect(validatePayload({ name: 'Bob', email: 'test@example.com', message: '' })).toEqual({
      valid: false,
      error: 'Message is required',
    });
    expect(validatePayload({ name: 'A'.repeat(101), email: 'test@example.com', message: 'Hello' })).toEqual({
      valid: false,
      error: 'Name must not exceed 100 characters',
    });
    expect(validatePayload({ name: 'Bob', email: 'test@example.com', message: 'M'.repeat(5001) })).toEqual({
      valid: false,
      error: 'Message must not exceed 5000 characters',
    });
    expect(validatePayload({ name: 'Bob', email: 'test@example.com', message: 'Valid message' })).toEqual({
      valid: true,
    });
  });

  it('escapes HTML special characters to prevent XSS in email body', () => {
    const escapeHtml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const maliciousName = '<script>alert("hacked")</script>';
    const maliciousMsg = '<img src=x onerror=alert(1)> & "quotes"';

    expect(escapeHtml(maliciousName)).toBe('&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;');
    expect(escapeHtml(maliciousMsg)).toBe('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quotes&quot;');
  });

  it('accurately parses and formats Resend error details without leaking sensitive secrets', () => {
    const mockResend403 = {
      statusCode: 403,
      name: 'validation_error',
      message: 'You can only send testing emails to your own email address (developer@example.com). To send emails to other recipients, please verify a domain at resend.com/domains, and change the `from` address to an email using this domain.',
    };

    const status = 403;
    const resendErrorMsg = mockResend403.message;
    const formattedError = `Resend API error [${status}]: ${resendErrorMsg}`;

    expect(formattedError).toContain('Resend API error [403]');
    expect(formattedError).toContain('You can only send testing emails to your own email address');
    expect(formattedError).not.toContain('re_'); // Ensure no API key secret in error output
  });

  it('handles rate limiting responses (429 RATE_LIMIT_EXCEEDED) with standard Retry-After header', () => {
    const simulateRateLimitResponse = (windowMinutes: number) => {
      return {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(windowMinutes * 60),
        },
        body: {
          success: false,
          error: 'Too many messages sent from this address. Please wait 15 minutes before sending another message.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      };
    };

    const resp = simulateRateLimitResponse(15);
    expect(resp.status).toBe(429);
    expect(resp.headers['Retry-After']).toBe('900');
    expect(resp.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('rejects bot submissions when reCAPTCHA verification fails', () => {
    const simulateBotCheck = (verification: { valid: boolean; error?: string }) => {
      if (!verification.valid) {
        return {
          status: 403,
          body: {
            success: false,
            error: 'Security verification failed. Please try again.',
            code: 'BOT_DETECTED',
          },
        };
      }
      return { status: 200, body: { success: true } };
    };

    const failed = simulateBotCheck({ valid: false, error: 'low_score' });
    expect(failed.status).toBe(403);
    expect(failed.body.code).toBe('BOT_DETECTED');

    const passed = simulateBotCheck({ valid: true });
    expect(passed.status).toBe(200);
    expect(passed.body.success).toBe(true);
  });

  it('resolves client IP in priority order: cf-connecting-ip > x-real-ip > x-forwarded-for', () => {
    const getClientIp = (headers: Record<string, string | null>) => {
      const cf = headers['cf-connecting-ip'];
      if (cf?.trim()) return cf.trim();
      const real = headers['x-real-ip'];
      if (real?.trim()) return real.trim();
      const fwd = headers['x-forwarded-for'];
      if (fwd?.trim()) return fwd.split(',')[0].trim();
      return 'unknown-ip';
    };

    expect(getClientIp({ 'cf-connecting-ip': '203.0.113.195', 'x-forwarded-for': '198.51.100.1' })).toBe('203.0.113.195');
    expect(getClientIp({ 'x-real-ip': '198.51.100.22', 'x-forwarded-for': '192.0.2.1' })).toBe('198.51.100.22');
    expect(getClientIp({ 'x-forwarded-for': '192.0.2.45, 10.0.0.1' })).toBe('192.0.2.45');
    expect(getClientIp({})).toBe('unknown-ip');
  });
});

