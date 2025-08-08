
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ReactLoader from './components/ReactLoader';
import App from './App';
import { errorHandler } from './utils/errorHandler';
import './index.css';
import './webVitals';

if (import.meta.env.DEV) {
  import('@axe-core/react').then(async ({ default: axe }) => {
    const React = await import('react');
    const ReactDOM = await import('react-dom');
    axe(React, ReactDOM, 1000);
  });
}

// Security: Remove React from global scope in production
// Removed React global assignment to prevent conflicts

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

function initializeApp() {
  // Initialize error handling first
  errorHandler.initialize();

  // Security: Remove any initial loader
  const initialLoader = document.getElementById('loader');
  if (initialLoader) {
    initialLoader.style.display = 'none';
  }

  try {
    const root = createRoot(container);
    
    root.render(
      <StrictMode>
        <ReactLoader>
          <App />
        </ReactLoader>
      </StrictMode>
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to render app:', error);
    }
    
    // Show error message
    container.innerHTML = `
      <div style="
        display: flex; 
        justify-content: center; 
        align-items: center; 
        height: 100vh; 
        font-family: system-ui, sans-serif;
        background: #fef2f2;
        color: #dc2626;
      ">
        <div style="text-align: center; max-width: 400px; padding: 2rem;">
          <h1 style="margin-bottom: 1rem;">Failed to Load</h1>
          <p style="margin-bottom: 1rem;">There was an error loading the application.</p>
          <button onclick="window.location.reload()" style="
            background: #dc2626; 
            color: white; 
            border: none; 
            padding: 0.5rem 1rem; 
            border-radius: 0.25rem; 
            cursor: pointer;
          ">Reload Page</button>
        </div>
      </div>
    `;
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
