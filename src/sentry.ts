import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  // Capture 20% of transactions for performance monitoring
  tracesSampleRate: 0.2,
});

export default Sentry;
