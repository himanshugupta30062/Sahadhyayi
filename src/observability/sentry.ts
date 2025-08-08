import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // no-op if not configured

  Sentry.init({
    dsn,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.2, // tune in prod
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE || undefined
  });
}
