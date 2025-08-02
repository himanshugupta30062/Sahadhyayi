
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSecurity } from './utils/security';

// Ensure React is available globally for libraries
(window as any).React = React;

// Initialize security measures
initializeSecurity();

console.log('Main.tsx loading...');

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

console.log('Rendering App...');

// Ensure React is fully loaded before rendering
if (!React || !React.createElement) {
  throw new Error('React is not properly loaded');
}

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log('App rendered successfully');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
}
