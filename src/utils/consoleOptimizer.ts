// Production-safe console utilities
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  }
};

// Audit trail for specific operations
export const auditLogger = {
  logUserAction: (userId: string, action: string, details?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[AUDIT] User ${userId} ${action}`, details ? `at ${new Date().toISOString()}` : '', details || '');
    }
  },
  
  logApiCall: (endpoint: string, method: string, status?: number) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${method} ${endpoint}`, status ? `- ${status}` : '');
    }
  }
};