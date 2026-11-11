// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SECURITY_CONFIG, SecurityMiddleware, SecurityMonitor } from './securityConfig';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SecurityMiddleware', () => {
  it('validates configured trusted origins and rejects malformed or untrusted origins', () => {
    expect(SecurityMiddleware.validateOrigin('https://maps.googleapis.com')).toBe(true);
    expect(SecurityMiddleware.validateOrigin('https://fonts.googleapis.com')).toBe(true);
    expect(SecurityMiddleware.validateOrigin('https://evil.example')).toBe(false);
    expect(SecurityMiddleware.validateOrigin('not a url')).toBe(false);
    expect(SecurityMiddleware.validateOrigin('')).toBe(false);
  });

  it('sanitizes unsafe user-agent characters and limits the output length', () => {
    expect(SecurityMiddleware.sanitizeUserAgent('Browser <test> "quoted" & value')).toBe('Browser test quoted  value');
    expect(SecurityMiddleware.sanitizeUserAgent('')).toBe('Unknown');
    expect(SecurityMiddleware.sanitizeUserAgent(null as unknown as string)).toBe('Unknown');
    expect(SecurityMiddleware.sanitizeUserAgent('x'.repeat(250))).toHaveLength(200);
  });

  it('accepts empty referers, trusted referers, and same-origin referers', () => {
    expect(SecurityMiddleware.validateReferer('')).toBe(true);
    expect(SecurityMiddleware.validateReferer('https://maps.googleapis.com/path')).toBe(true);
    expect(SecurityMiddleware.validateReferer(window.location.origin + '/account')).toBe(true);
    expect(SecurityMiddleware.validateReferer('https://evil.example/path')).toBe(false);
    expect(SecurityMiddleware.validateReferer('malformed')).toBe(false);
  });

  it('builds secure JSON request options with optional same-origin credentials', () => {
    const withCredentials = SecurityMiddleware.createSecureRequestOptions();
    expect(withCredentials.credentials).toBe('same-origin');
    expect(withCredentials.headers).toMatchObject({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
    });

    const withoutCredentials = SecurityMiddleware.createSecureRequestOptions(false);
    expect(withoutCredentials).not.toHaveProperty('credentials');
    expect(withoutCredentials.headers).toEqual(withCredentials.headers);
  });

  it('logs security violations with contextual browser metadata', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    SecurityMiddleware.logSecurityViolation('TEST_VIOLATION', { detail: 'test' });

    expect(warn).toHaveBeenCalledWith('[SECURITY]', expect.objectContaining({
      type: 'SECURITY_VIOLATION',
      violation: 'TEST_VIOLATION',
      details: { detail: 'test' },
      timestamp: expect.any(String),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referer: document.referrer,
    }));
  });
});

describe('SecurityMonitor', () => {
  it('records events and summarizes totals, recent events, and distinct types', () => {
    const before = SecurityMonitor.getSecuritySummary();
    SecurityMonitor.recordEvent('COVERAGE_TEST_EVENT', { source: 'unit-test' });
    const after = SecurityMonitor.getSecuritySummary();

    expect(after.totalEvents).toBe(before.totalEvents + 1);
    expect(after.recentEvents).toBe(before.recentEvents + 1);
    expect(after.eventTypes).toContain('COVERAGE_TEST_EVENT');
  });

  it('emits a rapid-request violation after more than twenty recent events', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (let i = 0; i < 21; i += 1) {
      SecurityMonitor.recordEvent('RAPID_TEST_EVENT', { index: i });
    }

    expect(warn).toHaveBeenCalledWith('[SECURITY]', expect.objectContaining({
      violation: 'RAPID_REQUESTS',
      details: expect.objectContaining({ count: expect.any(Number), timeframe: '1_minute' }),
    }));
  });

  it('emits a multiple-failed-login violation after more than three failures', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (let i = 0; i < 4; i += 1) {
      SecurityMonitor.recordEvent('LOGIN_FAILED', { attempt: i });
    }

    expect(warn).toHaveBeenCalledWith('[SECURITY]', expect.objectContaining({
      violation: 'MULTIPLE_LOGIN_FAILURES',
      details: { count: 4, timeframe: '1_minute' },
    }));
  });
});

describe('SECURITY_CONFIG', () => {
  it('keeps the configured limits and security header defaults available', () => {
    expect(SECURITY_CONFIG.RATE_LIMITS.SIGNIN).toEqual({ attempts: 5, windowMs: 300000 });
    expect(SECURITY_CONFIG.VALIDATION.PASSWORD_MIN_LENGTH).toBe(8);
    expect(SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE).toBe(5 * 1024 * 1024);
    expect(SECURITY_CONFIG.SESSION.MAX_AGE).toBe(24 * 60 * 60 * 1000);
    expect(SECURITY_CONFIG.SECURITY_HEADERS['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(SECURITY_CONFIG.CSP['default-src']).toEqual(["'self'"]);
  });
});
