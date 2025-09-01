// src/utils/consoleOptimizer.ts
var logger = {
  log: (...args) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  },
  info: (...args) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },
  debug: (...args) => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  }
};
var auditLogger = {
  logUserAction: (userId, action, details) => {
    if (import.meta.env.DEV) {
      console.log(`[AUDIT] User ${userId} ${action}`, details ? `at ${(/* @__PURE__ */ new Date()).toISOString()}` : "", details || "");
    }
  },
  logApiCall: (endpoint, method, status) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${method} ${endpoint}`, status ? `- ${status}` : "");
    }
  }
};
export {
  auditLogger,
  logger
};
