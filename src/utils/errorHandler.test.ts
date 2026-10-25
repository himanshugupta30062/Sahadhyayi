// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler, useErrorHandler, type ErrorReport } from './errorHandler';

const toastMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/use-toast', () => ({ toast: toastMock }));
vi.mock('@/sentry', () => ({
  addSentryBreadcrumb: vi.fn(),
  captureError: vi.fn(),
}));

const report = (
  message: string,
  severity: ErrorReport['severity'] = 'medium',
): ErrorReport => ({
  message,
  type: 'custom',
  severity,
  context: { timestamp: 1, userAgent: 'test-agent', route: '/test' },
});

describe('errorHandler', () => {
  beforeEach(() => {
    errorHandler.clearErrors();
    toastMock.mockClear();
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_SENTRY_DSN', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('starts with an empty queue after clearErrors', () => {
    errorHandler.handleError(report('first error'));
    errorHandler.clearErrors();

    expect(errorHandler.getErrorStats()).toEqual({
      totalErrors: 0,
      stats: {},
      recentErrors: [],
    });
  });

  it('records counts by error type and severity', () => {
    errorHandler.handleError(report('one'));
    errorHandler.handleError({ ...report('two', 'high'), type: 'network' });
    errorHandler.handleError({ ...report('three', 'high'), type: 'network' });

    expect(errorHandler.getErrorStats()).toMatchObject({
      totalErrors: 3,
      stats: {
        custom: 1,
        network: 2,
        severity_medium: 1,
        severity_high: 2,
      },
    });
  });

  it('returns no more than the five most recent reports', () => {
    for (let i = 1; i <= 7; i += 1) {
      errorHandler.handleError(report(`error ${i}`));
    }

    expect(errorHandler.getErrorStats().recentErrors.map((item) => item.message)).toEqual([
      'error 3',
      'error 4',
      'error 5',
      'error 6',
      'error 7',
    ]);
  });

  it('keeps the queue bounded at fifty reports', () => {
    for (let i = 1; i <= 55; i += 1) {
      errorHandler.handleError(report(`error ${i}`));
    }

    const stats = errorHandler.getErrorStats();
    expect(stats.totalErrors).toBe(50);
    expect(stats.recentErrors.map((item) => item.message)).toEqual([
      'error 51',
      'error 52',
      'error 53',
      'error 54',
      'error 55',
    ]);
  });

  it('shows a destructive toast for critical errors', () => {
    errorHandler.handleError(report('chunk loading failed', 'critical'));

    expect(toastMock).toHaveBeenCalledWith({
      title: 'Critical Error',
      description: 'Something went wrong. Please refresh the page.',
      variant: 'destructive',
    });
  });

  it('shows a default toast for high-severity errors', () => {
    errorHandler.handleError(report('permission denied', 'high'));

    expect(toastMock).toHaveBeenCalledWith({
      title: 'Error Occurred',
      description: 'An error occurred. Some features may not work properly.',
      variant: 'default',
    });
  });

  it('does not toast for medium- or low-severity errors', () => {
    errorHandler.handleError(report('minor issue', 'medium'));
    errorHandler.handleError(report('informational issue', 'low'));

    expect(toastMock).not.toHaveBeenCalled();
  });

  it('creates custom reports with the requested context and severity', () => {
    errorHandler.reportCustomError('custom failure', { userId: 'reader-1', action: 'save' }, 'high');

    const stats = errorHandler.getErrorStats();
    expect(stats.totalErrors).toBe(1);
    expect(stats.recentErrors[0]).toMatchObject({
      message: 'custom failure',
      type: 'custom',
      severity: 'high',
      context: {
        userId: 'reader-1',
        action: 'save',
        route: '/test',
        userAgent: navigator.userAgent,
      },
    });
    expect(stats.recentErrors[0].context.timestamp).toEqual(expect.any(Number));
  });

  it('exposes report, stats, and clear helpers through useErrorHandler', () => {
    const helper = useErrorHandler();
    helper.reportError('reported by hook', { component: 'TestPanel' }, 'low');

    expect(helper.getErrorStats().recentErrors[0]).toMatchObject({
      message: 'reported by hook',
      severity: 'low',
      context: { component: 'TestPanel' },
    });

    helper.clearErrors();
    expect(helper.getErrorStats().totalErrors).toBe(0);
  });
});
