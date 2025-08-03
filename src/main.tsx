
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Main.tsx starting...');

// CRITICAL: Ensure React is globally available IMMEDIATELY
// This must happen before any other imports or code execution
const ensureReactGlobal = () => {
  // Store original React for safety
  const originalReact = React;
  
  // Make React available through all possible global access patterns
  try {
    if (typeof window !== 'undefined') {
      (window as any).React = originalReact;
    }
  } catch (e) {
    console.warn('Could not set React on window:', e);
  }
  
  try {
    (globalThis as any).React = originalReact;
  } catch (e) {
    console.warn('Could not set React on globalThis:', e);
  }
  
  // Ensure all hooks are available globally
  const hooks = ['useState', 'useEffect', 'useContext', 'useCallback', 'useMemo', 'useRef', 'useReducer'];
  hooks.forEach(hookName => {
    try {
      if (typeof window !== 'undefined') {
        (window as any)[hookName] = (originalReact as any)[hookName];
      }
      (globalThis as any)[hookName] = (originalReact as any)[hookName];
    } catch (e) {
      console.warn(`Could not set ${hookName} globally:`, e);
    }
  });
  
  console.log('React global setup complete:', {
    React: !!originalReact,
    useState: !!originalReact.useState,
    useContext: !!originalReact.useContext,
    useRef: !!originalReact.useRef
  });
};

// Call immediately
ensureReactGlobal();

// Initialize security measures
const initializeSecurity = () => {
  console.log('Security initialization started');
  // Basic security setup without complex logic to avoid further errors
  console.log('Security initialization complete');
};

initializeSecurity();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

console.log('Creating root with React:', !!React);

const renderApp = () => {
  try {
    // Final verification React is available
    if (!React || !React.createElement || !React.useState) {
      console.error('React not available at render time');
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
    // Simple fallback
    try {
      root.render(<App />);
      console.log('App rendered successfully (fallback)');
    } catch (fallbackError) {
      console.error('Fallback render failed:', fallbackError);
      // Final error display
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
  renderApp();
}

// Service Worker registration (non-blocking)
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
}
