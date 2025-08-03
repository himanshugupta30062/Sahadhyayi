
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Main.tsx starting...');
console.log('React available:', !!React);
console.log('React.useState:', !!React.useState);

// Ensure React hooks are available globally
if (!window.React) {
  window.React = React;
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

const renderApp = () => {
  console.log('Rendering app...');
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
  renderApp();
}
