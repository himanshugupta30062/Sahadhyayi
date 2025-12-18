import * as Sentry from '@sentry/react';

// Initialize Sentry with enhanced configuration
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Performance monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  
  // Session replay for error debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment configuration
  environment: import.meta.env.MODE,
  
  // Release tracking
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Filter out known non-actionable errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Ignore certain error types
    if (error instanceof Error) {
      // Ignore ResizeObserver errors (common browser quirk)
      if (error.message.includes('ResizeObserver')) {
        return null;
      }
      
      // Ignore extension-related errors
      if (error.message.includes('extension') || error.message.includes('Extension')) {
        return null;
      }
      
      // Ignore network errors that are expected (user offline, etc.)
      if (error.message.includes('Failed to fetch') && !navigator.onLine) {
        return null;
      }
    }
    
    return event;
  },
  
  // Add extra context to errors
  initialScope: {
    tags: {
      app: 'sahadhyayi',
    },
  },
});

// Helper to set user context when authenticated
export const setSentryUser = (userId: string, email?: string, username?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
};

// Helper to clear user context on logout
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

// Helper to add breadcrumb for user actions
export const addSentryBreadcrumb = (
  category: string,
  message: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

// Helper to capture custom errors with context
export const captureError = (
  error: Error,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'error'
) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    scope.setLevel(level);
    Sentry.captureException(error);
  });
};

// Helper to capture messages
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
};

export default Sentry;