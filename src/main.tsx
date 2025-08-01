
import { StrictMode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSecurity } from './utils/security';

// Initialize security measures
initializeSecurity();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
}
