import { useCallback } from 'react';
import { errorHandler } from '@/utils/errorHandler';

export const useAsyncError = () => {
  const reportAsyncError = useCallback((error: Error, context?: { action?: string; component?: string }) => {
    errorHandler.handleError({
      message: error.message,
      stack: error.stack,
      type: 'promise',
      context: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        route: window.location.pathname,
        ...context,
      },
      severity: 'high',
    });
  }, []);

  const safeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    fallback?: T,
    context?: { action?: string; component?: string }
  ): Promise<T | undefined> => {
    try {
      return await asyncFn();
    } catch (error) {
      reportAsyncError(error as Error, context);
      return fallback;
    }
  }, [reportAsyncError]);

  return { reportAsyncError, safeAsync };
};