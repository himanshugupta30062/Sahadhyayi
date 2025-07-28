
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSecurity } from './utils/security'

// Initialize security measures
initializeSecurity();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Only register service worker if not running in StackBlitz or WebContainer
    if (!window.location.hostname.includes('stackblitz') && 
        !window.location.hostname.includes('webcontainer') &&
        !window.location.hostname.includes('local-credentialless')) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('Service Worker registration failed:', err.message);
      });
    } else {
      console.log('Service Worker registration skipped in development environment');
    }
  });
}
