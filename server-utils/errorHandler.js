// src/hooks/use-toast.ts
import { useState, useEffect } from "react";
var TOAST_LIMIT = 1;
var TOAST_REMOVE_DELAY = 1e6;
var count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}
var toastTimeouts = /* @__PURE__ */ new Map();
var addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};
var reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === action.toast.id ? { ...t, ...action.toast } : t
        )
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast2) => {
          addToRemoveQueue(toast2.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === toastId || toastId === void 0 ? {
            ...t,
            open: false
          } : t
        )
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === void 0) {
        return {
          ...state,
          toasts: []
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId)
      };
  }
};
var listeners = [];
var memoryState = { toasts: [] };
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}
function toast({ ...props }) {
  const id = genId();
  const update = (props2) => dispatch({
    type: "UPDATE_TOAST",
    toast: { ...props2, id }
  });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open)
          dismiss();
      }
    }
  });
  return {
    id,
    dismiss,
    update
  };
}

// src/utils/errorHandler.ts
var ErrorHandler = class _ErrorHandler {
  static instance;
  errorQueue = [];
  maxErrors = 50;
  isInitialized = false;
  static getInstance() {
    if (!_ErrorHandler.instance) {
      _ErrorHandler.instance = new _ErrorHandler();
    }
    return _ErrorHandler.instance;
  }
  initialize() {
    if (this.isInitialized || typeof window === "undefined")
      return;
    window.addEventListener("error", (event) => {
      var _a, _b, _c, _d;
      this.handleError({
        message: ((_a = event.error) == null ? void 0 : _a.message) || event.message,
        stack: (_b = event.error) == null ? void 0 : _b.stack,
        type: "javascript",
        context: this.createContext({
          component: (_c = event.filename) == null ? void 0 : _c.split("/").pop()
        }),
        severity: this.determineSeverity(((_d = event.error) == null ? void 0 : _d.message) || event.message)
      });
    });
    window.addEventListener("unhandledrejection", (event) => {
      var _a, _b;
      this.handleError({
        message: ((_a = event.reason) == null ? void 0 : _a.message) || String(event.reason),
        stack: (_b = event.reason) == null ? void 0 : _b.stack,
        type: "promise",
        context: this.createContext(),
        severity: "high"
      });
    });
    if ("navigator" in window && "onLine" in navigator) {
      window.addEventListener("offline", () => {
        this.handleError({
          message: "Network connection lost",
          type: "network",
          context: this.createContext(),
          severity: "medium"
        });
      });
    }
    this.isInitialized = true;
  }
  handleError(errorReport) {
    this.errorQueue.push(errorReport);
    if (this.errorQueue.length > this.maxErrors) {
      this.errorQueue.shift();
    }
    if (import.meta.env.DEV) {
      console.group(`\u{1F6A8} Runtime Error [${errorReport.severity}]`);
      console.error("Message:", errorReport.message);
      console.error("Type:", errorReport.type);
      console.error("Context:", errorReport.context);
      if (errorReport.stack) {
        console.error("Stack:", errorReport.stack);
      }
      console.groupEnd();
    }
    this.showUserNotification(errorReport);
    this.reportToService(errorReport);
  }
  createContext(additional = {}) {
    return {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      route: window.location.pathname,
      ...additional
    };
  }
  determineSeverity(message) {
    if (!message)
      return "medium";
    const criticalKeywords = ["chunk", "loading", "network", "fetch", "import"];
    const highKeywords = ["undefined", "null", "cannot read", "permission"];
    const lowerMessage = message.toLowerCase();
    if (criticalKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      return "critical";
    }
    if (highKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      return "high";
    }
    return "medium";
  }
  showUserNotification(errorReport) {
    const messages = {
      critical: {
        title: "Critical Error",
        description: "Something went wrong. Please refresh the page."
      },
      high: {
        title: "Error Occurred",
        description: "An error occurred. Some features may not work properly."
      },
      medium: {
        title: "Minor Issue",
        description: "A minor issue was detected and has been logged."
      },
      low: {
        title: "Info",
        description: "A minor issue was detected."
      }
    };
    const notification = messages[errorReport.severity];
    if (errorReport.severity === "critical" || errorReport.severity === "high") {
      toast({
        title: notification.title,
        description: notification.description,
        variant: errorReport.severity === "critical" ? "destructive" : "default"
      });
    }
  }
  reportToService(errorReport) {
    if (import.meta.env.PROD) {
    }
  }
  // Method to manually report custom errors
  reportCustomError(message, context, severity = "medium") {
    this.handleError({
      message,
      type: "custom",
      context: this.createContext(context),
      severity
    });
  }
  // Get error statistics for debugging
  getErrorStats() {
    const stats = this.errorQueue.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      acc[`severity_${error.severity}`] = (acc[`severity_${error.severity}`] || 0) + 1;
      return acc;
    }, {});
    return {
      totalErrors: this.errorQueue.length,
      stats,
      recentErrors: this.errorQueue.slice(-5)
    };
  }
  // Clear error queue
  clearErrors() {
    this.errorQueue = [];
  }
};
var errorHandler = ErrorHandler.getInstance();
var useErrorHandler = () => {
  return {
    reportError: (message, context, severity = "medium") => {
      errorHandler.reportCustomError(message, context, severity);
    },
    getErrorStats: () => errorHandler.getErrorStats(),
    clearErrors: () => errorHandler.clearErrors()
  };
};
export {
  errorHandler,
  useErrorHandler
};
