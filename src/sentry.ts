import {
  addBreadcrumb,
  captureException,
  captureMessage as sentryCaptureMessage,
  init,
  setUser,
  showReportDialog,
  withScope,
  type SeverityLevel,
} from '@sentry/browser';

init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
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

export const setSentryUser = (userId: string, email?: string, username?: string) =>
  setUser({ id: userId, email, username });
export const clearSentryUser = () => setUser(null);
export const addSentryBreadcrumb = (category: string, message: string, level: SeverityLevel = 'info', data?: Record<string, any>) =>
  addBreadcrumb({ category, message, level, data, timestamp: Date.now() / 1000 });
export const captureError = (error: Error, context?: Record<string, any>, level: SeverityLevel = 'error') =>
  withScope((scope) => {
    if (context) scope.setExtras(context);
    scope.setLevel(level);
    captureException(error);
  });
export const captureMessage = (message: string, level: SeverityLevel = 'info', context?: Record<string, any>) =>
  withScope((scope) => {
    if (context) scope.setExtras(context);
    scope.setLevel(level);
    sentryCaptureMessage(message);
  });

export default { captureException, showReportDialog };
