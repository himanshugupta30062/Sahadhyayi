
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Main.tsx starting...');
console.log('React available:', !!React);
console.log('React.useState:', !!React.useState);

// Ensure React is available globally before any component rendering
if (typeof window !== 'undefined') {
  window.React = React;
  // Also ensure React hooks are available
  window.ReactHooks = {
    useState: React.useState,
    useEffect: React.useEffect,
    useContext: React.useContext,
    useCallback: React.useCallback,
    useMemo: React.useMemo
  };
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

const renderApp = () => {
  console.log('Rendering app...');
  console.log('React available at render time:', !!React);
  console.log('React.useState available:', !!React.useState);
  
  // Ensure React is still available
  if (!React || typeof React.useState !== 'function') {
    console.error('React or React hooks not available during render');
    root.render(
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>React Loading Error</h1>
          <p>React hooks are not available. Please refresh the page.</p>
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
    return;
  }
  
  try {
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
  // Add a small delay to ensure all modules are loaded
  setTimeout(renderApp, 0);
}
