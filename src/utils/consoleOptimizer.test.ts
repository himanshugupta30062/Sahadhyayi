import { afterEach, describe, expect, it, vi } from 'vitest';
import { auditLogger, logger } from './consoleOptimizer';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('logger', () => {
  it('writes debug-level messages in development', () => {
    vi.stubEnv('DEV', true);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.log('hello', 1);
    logger.warn('careful');
    logger.info('details');
    logger.debug('trace');

    expect(log).toHaveBeenCalledWith('hello', 1);
    expect(warn).toHaveBeenCalledWith('careful');
    expect(info).toHaveBeenCalledWith('details');
    expect(debug).toHaveBeenCalledWith('trace');
  });

  it('suppresses non-error logging outside development', () => {
    vi.stubEnv('DEV', false);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.log('hello');
    logger.warn('careful');
    logger.info('details');
    logger.debug('trace');

    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(debug).not.toHaveBeenCalled();
  });

  it('always writes errors, including outside development', () => {
    vi.stubEnv('DEV', false);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('failure', { code: 'E_TEST' });

    expect(error).toHaveBeenCalledWith('failure', { code: 'E_TEST' });
  });
});

describe('auditLogger', () => {
  it('records user actions in development with timestamped details', () => {
    vi.stubEnv('DEV', true);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-10-25T00:00:00.000Z');

    auditLogger.logUserAction('user-1', 'updated profile', { source: 'settings' });

    expect(log).toHaveBeenCalledWith(
      '[AUDIT] User user-1 updated profile',
      'at 2026-10-25T00:00:00.000Z',
      { source: 'settings' }
    );
  });

  it('records user actions without details and suppresses audit logs in production', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubEnv('DEV', true);
    auditLogger.logUserAction('user-2', 'signed in');
    expect(log).toHaveBeenCalledWith('[AUDIT] User user-2 signed in', '', '');

    log.mockClear();
    vi.stubEnv('DEV', false);
    auditLogger.logUserAction('user-2', 'signed out');
    auditLogger.logApiCall('/api/books', 'GET', 200);
    expect(log).not.toHaveBeenCalled();
  });

  it('logs API calls with and without status in development', () => {
    vi.stubEnv('DEV', true);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    auditLogger.logApiCall('/api/books', 'GET', 200);
    auditLogger.logApiCall('/api/session', 'POST');

    expect(log).toHaveBeenNthCalledWith(1, '[API] GET /api/books', '- 200');
    expect(log).toHaveBeenNthCalledWith(2, '[API] POST /api/session', '');
  });
});
