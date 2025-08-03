
import * as React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ReactLoader from './components/ReactLoader';
import App from './App';
import './index.css';

console.log('Main.tsx: Starting application...');
console.log('React imported:', !!React);
console.log('React.version:', React.version);

// Ensure React is globally available
if (typeof window !== 'undefined') {
  (window as any).React = React;
  console.log('React attached to window');
}

const container = document.getElementById("root");
if (!container) {
  console.error('Root element not found!');
  throw new Error("Root element not found");
}

console.log('Root container found');

function initializeApp() {
  console.log('Initializing app with ReactLoader...');
  
  try {
    const root = createRoot(container);
    console.log('React root created successfully');
    
    root.render(
      <StrictMode>
        <ReactLoader>
          <App />
        </ReactLoader>
      </StrictMode>
    );

    console.log('App with ReactLoader rendered successfully');
  } catch (error) {
    console.error('Failed to render app:', error);
    
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

// Initialize immediately if DOM is ready
if (document.readyState === 'loading') {
  console.log('DOM still loading, waiting...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  console.log('DOM already ready, initializing...');
  initializeApp();
}
