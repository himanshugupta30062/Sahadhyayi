import { toast } from '@/hooks/use-toast';

export interface ErrorContext {
  userId?: string;
  route?: string;
  component?: string;
  action?: string;
  timestamp: number;
  userAgent: string;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  type: 'javascript' | 'promise' | 'react' | 'network' | 'custom';
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private maxErrors = 50;
  private isInitialized = false;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Global JavaScript error handler
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.error?.message || event.message,
        stack: event.error?.stack,
        type: 'javascript',
        context: this.createContext({
          component: event.filename?.split('/').pop(),
        }),
        severity: this.determineSeverity(event.error?.message || event.message),
      });
    });

    // Unhandled Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        type: 'promise',
        context: this.createContext(),
        severity: 'high',
      });
    });

    // Network errors (optional enhancement)
    if ('navigator' in window && 'onLine' in navigator) {
      window.addEventListener('offline', () => {
        this.handleError({
          message: 'Network connection lost',
          type: 'network',
          context: this.createContext(),
          severity: 'medium',
        });
      });
    }

    this.isInitialized = true;
  }

  handleError(errorReport: ErrorReport) {
    // Add to queue
    this.errorQueue.push(errorReport);
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxErrors) {
      this.errorQueue.shift();
    }

    // Log in development
      if (import.meta.env.DEV) {
        console.group(`🚨 Runtime Error [${errorReport.severity}]`);
        console.error('Message:', errorReport.message);
        console.error('Type:', errorReport.type);
        console.error('Context:', errorReport.context);
        if (errorReport.stack) {
          console.error('Stack:', errorReport.stack);
        }
        console.groupEnd();
      }

    // Show user-friendly notification based on severity
    this.showUserNotification(errorReport);

    // In production, you could send to error tracking service
    this.reportToService(errorReport);
  }

  private createContext(additional: Partial<ErrorContext> = {}): ErrorContext {
    return {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      route: window.location.pathname,
      ...additional,
    };
  }

  private determineSeverity(message?: string): ErrorReport['severity'] {
    if (!message) return 'medium';
    const criticalKeywords = ['chunk', 'loading', 'network', 'fetch', 'import'];
    const highKeywords = ['undefined', 'null', 'cannot read', 'permission'];
    
    const lowerMessage = message.toLowerCase();
    
    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'critical';
    }
    if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    }
    return 'medium';
  }

  private showUserNotification(errorReport: ErrorReport) {
    const messages = {
      critical: {
        title: 'Critical Error',
        description: 'Something went wrong. Please refresh the page.',
      },
      high: {
        title: 'Error Occurred',
        description: 'An error occurred. Some features may not work properly.',
      },
      medium: {
        title: 'Minor Issue',
        description: 'A minor issue was detected and has been logged.',
      },
      low: {
        title: 'Info',
        description: 'A minor issue was detected.',
      },
    };

    const notification = messages[errorReport.severity];
    
    // Only show toast for critical and high severity errors
    if (errorReport.severity === 'critical' || errorReport.severity === 'high') {
      toast({
        title: notification.title,
        description: notification.description,
        variant: errorReport.severity === 'critical' ? 'destructive' : 'default',
      });
    }
  }

  private reportToService(errorReport: ErrorReport) {
    // In production, implement error reporting service
    // Example: Send to Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      // Implement your error reporting service here
      // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) });
    }
  }

  // Method to manually report custom errors
  reportCustomError(message: string, context?: Partial<ErrorContext>, severity: ErrorReport['severity'] = 'medium') {
    this.handleError({
      message,
      type: 'custom',
      context: this.createContext(context),
      severity,
    });
  }

  // Get error statistics for debugging
  getErrorStats() {
    const stats = this.errorQueue.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      acc[`severity_${error.severity}`] = (acc[`severity_${error.severity}`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errorQueue.length,
      stats,
      recentErrors: this.errorQueue.slice(-5),
    };
  }

  // Clear error queue
  clearErrors() {
    this.errorQueue = [];
  }
}

export const errorHandler = ErrorHandler.getInstance();

// Hook for components to report errors
export const useErrorHandler = () => {
  return {
    reportError: (message: string, context?: Partial<ErrorContext>, severity: ErrorReport['severity'] = 'medium') => {
      errorHandler.reportCustomError(message, context, severity);
    },
    getErrorStats: () => errorHandler.getErrorStats(),
    clearErrors: () => errorHandler.clearErrors(),
  };
};
