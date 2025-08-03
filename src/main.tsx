
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSecurity } from './utils/security';

console.log('Main.tsx starting...');
console.log('React object before init:', React);

// Ensure React is available globally BEFORE anything else
if (typeof window !== 'undefined') {
  (window as any).React = React;
  console.log('React set on window:', (window as any).React);
}

// Verify React is properly initialized
if (!React || typeof React.createElement !== 'function') {
  console.error('React is not properly initialized!');
  throw new Error('React initialization failed');
}

// Initialize security measures
initializeSecurity();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

console.log('Rendering App with React:', !!React);

// Add a small delay to ensure React is fully ready
const renderApp = () => {
  try {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
  }
};

// Render immediately since React should be ready
renderApp();

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
} else {
  console.warn('Service Worker not registered: insecure context or unsupported browser');
}
