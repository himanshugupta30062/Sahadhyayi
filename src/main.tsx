
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSecurity } from './utils/security';

// Initialize security measures
initializeSecurity();

console.log('Main.tsx loading...');

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

// Ensure we have a clean root
const root = createRoot(container);

console.log('Rendering App...');

// Add error boundary at the root level
const AppWithErrorBoundary = () => {
  try {
    return <App />;
  } catch (error) {
    console.error('Error in App component:', error);
    return <div>Something went wrong. Please refresh the page.</div>;
  }
};

root.render(
  <React.StrictMode>
    <AppWithErrorBoundary />
  </React.StrictMode>
);

console.log('App rendered successfully');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
}
