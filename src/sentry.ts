import * as Sentry from '@sentry/react';

// Error reporting and performance monitoring; session replay is disabled.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error instanceof Error) {
      if (error.message.includes('ResizeObserver')) return null;
      if (error.message.includes('extension') || error.message.includes('Extension')) return null;
      if (error.message.includes('Failed to fetch') && !navigator.onLine) return null;
    }
    return event;
  },
  initialScope: { tags: { app: 'sahadhyayi' } },
});

export const setSentryUser = (userId: string, email?: string, username?: string) => {
  Sentry.setUser({ id: userId, email, username });
};
export const clearSentryUser = () => Sentry.setUser(null);
export const addSentryBreadcrumb = (category: string, message: string, level: Sentry.SeverityLevel = 'info', data?: Record<string, any>) => {
  Sentry.addBreadcrumb({ category, message, level, data, timestamp: Date.now() / 1000 });
};
export const captureError = (error: Error, context?: Record<string, any>, level: Sentry.SeverityLevel = 'error') => {
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    scope.setLevel(level);
    Sentry.captureException(error);
  });
};
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
};
export default Sentry;
