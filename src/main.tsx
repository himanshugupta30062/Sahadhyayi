
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSecurity } from './utils/security';

console.log('Main.tsx starting...');
console.log('React object before init:', React);

// CRITICAL: Complete React initialization strategy
// We need to ensure React is available through ALL possible access patterns

// 1. Store the original React reference
const originalReact = React;

// 2. Safely set React on window if possible
if (typeof window !== 'undefined') {
  try {
    // Check if React property already exists and is configurable
    const descriptor = Object.getOwnPropertyDescriptor(window, 'React');
    if (!descriptor || descriptor.configurable !== false) {
      (window as any).React = originalReact;
      console.log('React set on window:', (window as any).React);
    } else {
      console.warn('React property on window is not configurable');
    }
  } catch (error) {
    console.warn('Could not set React on window:', error);
    // Fallback: try to define it differently
    try {
      Object.defineProperty(window, 'ReactFallback', {
        value: originalReact,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } catch (fallbackError) {
      console.warn('Fallback React assignment also failed:', fallbackError);
    }
  }
}

// 3. Ensure React is available on globalThis
try {
  (globalThis as any).React = originalReact;
} catch (error) {
  console.warn('Could not set React on globalThis:', error);
}

// 4. Ensure React is available on global (Node.js style)
if (typeof global !== 'undefined') {
  try {
    (global as any).React = originalReact;
  } catch (error) {
    console.warn('Could not set React on global:', error);
  }
}

// 5. Create a comprehensive React hooks proxy
const createHooksProxy = () => ({
  useState: originalReact.useState,
  useEffect: originalReact.useEffect,
  useContext: originalReact.useContext,
  useCallback: originalReact.useCallback,
  useMemo: originalReact.useMemo,
  useRef: originalReact.useRef,
  useReducer: originalReact.useReducer,
  useLayoutEffect: originalReact.useLayoutEffect,
  useImperativeHandle: originalReact.useImperativeHandle,
  useDebugValue: originalReact.useDebugValue,
});

// 6. Make hooks available globally through multiple access patterns
const hooksProxy = createHooksProxy();

// Set hooks on window safely
if (typeof window !== 'undefined') {
  try {
    (window as any).ReactHooks = hooksProxy;
    // Also set individual hooks directly on window for maximum compatibility
    Object.keys(hooksProxy).forEach(hookName => {
      try {
        (window as any)[hookName] = (hooksProxy as any)[hookName];
      } catch (error) {
        console.warn(`Could not set ${hookName} on window:`, error);
      }
    });
  } catch (error) {
    console.warn('Could not set React hooks on window:', error);
  }
}

// Set hooks on globalThis
try {
  (globalThis as any).ReactHooks = hooksProxy;
  // Set individual hooks on globalThis
  Object.keys(hooksProxy).forEach(hookName => {
    try {
      (globalThis as any)[hookName] = (hooksProxy as any)[hookName];
    } catch (error) {
      console.warn(`Could not set ${hookName} on globalThis:`, error);
    }
  });
} catch (error) {
  console.warn('Could not set React hooks on globalThis:', error);
}

// 7. Create a comprehensive React object that includes everything
const comprehensiveReact = {
  ...originalReact,
  ...hooksProxy,
};

// 8. Override common access patterns safely
if (typeof window !== 'undefined') {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'React');
    if (!descriptor || descriptor.configurable !== false) {
      (window as any).React = comprehensiveReact;
    }
  } catch (error) {
    console.warn('Could not set comprehensive React on window:', error);
  }
}

try {
  (globalThis as any).React = comprehensiveReact;
} catch (error) {
  console.warn('Could not set comprehensive React on globalThis:', error);
}

// 9. Set up module-style exports
const moduleExports = {
  React: comprehensiveReact,
  default: comprehensiveReact,
  ...hooksProxy
};

// Set up module-style exports safely
if (typeof module !== 'undefined' && module.exports) {
  try {
    Object.assign(module.exports, moduleExports);
  } catch (error) {
    console.warn('Could not assign module exports:', error);
  }
}

// 10. Final verification
console.log('React initialization verification:', {
  React: !!originalReact,
  ReactOnWindow: !!(typeof window !== 'undefined' && (window as any).React),
  ReactOnGlobalThis: !!(globalThis as any).React,
  useStateAvailable: !!originalReact.useState,
  useContextAvailable: !!originalReact.useContext,
  useRefAvailable: !!originalReact.useRef,
});

// Strict verification that React is properly initialized
if (!originalReact || typeof originalReact.createElement !== 'function') {
  console.error('React is not properly initialized!');
  throw new Error('React initialization failed - cannot proceed');
}

if (!originalReact.useState || !originalReact.useEffect || !originalReact.useContext) {
  console.error('React hooks are not properly initialized!');
  throw new Error('React hooks initialization failed - cannot proceed');
}

// Initialize security measures after React is ready
initializeSecurity();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

console.log('Creating root with React:', !!originalReact);

// Simple, direct render with additional safety checks
const renderApp = () => {
  try {
    // Final verification React is still available at render time
    if (!originalReact || !originalReact.createElement || !originalReact.useState) {
      console.error('React became unavailable before render');
      window.location.reload();
      return;
    }

    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
    // Simple fallback without StrictMode
    try {
      root.render(<App />);
      console.log('App rendered successfully (fallback)');
    } catch (fallbackError) {
      console.error('Fallback render also failed:', fallbackError);
      // Final fallback - show error message
      root.render(
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1>Application Error</h1>
            <p>Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                marginTop: '20px', 
                padding: '10px 20px', 
                background: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
  }
};

// Ensure DOM is ready before rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  // DOM is already ready
  renderApp();
}

// Service Worker registration (non-blocking)
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
} else {
  console.warn('Service Worker not registered: insecure context or unsupported browser');
}
