
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSecurity } from './utils/security';

// Initialize security measures
initializeSecurity();

console.log('Main.tsx loading...');
console.log('React object:', React);

// Ensure React is available globally
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

console.log('Rendering App...');

// Ensure React is properly initialized before rendering
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log('App rendered successfully');

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
} else {
  console.warn('Service Worker not registered: insecure context or unsupported browser');
}
