import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  // Capture 100% of transactions for performance; adjust in production
  tracesSampleRate: 0.2,
});

export default Sentry;
