
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSecurity } from './utils/security';

// Ensure React is available globally for libraries
(window as any).React = React;
(globalThis as any).React = React;

// Initialize security measures
initializeSecurity();

console.log('Main.tsx loading...', { React: !!React, createElement: !!React.createElement, timestamp: Date.now(), random: Math.random() });

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

// Add delay to ensure React is fully loaded
const initializeApp = () => {
  console.log('Initializing App...');
  
  // Ensure React is fully loaded before rendering
  if (!React || !React.createElement) {
    console.error('React not properly loaded, retrying...');
    setTimeout(initializeApp, 100);
    return;
  }

  const root = createRoot(container);

  console.log('Rendering App...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  console.log('App rendered successfully');
};

// Start initialization with a small delay to ensure all modules are loaded
setTimeout(initializeApp, 50);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
}
