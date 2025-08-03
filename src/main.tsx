
import * as React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Main.tsx: Starting application...');
console.log('React imported:', !!React);
console.log('React.version:', React.version);
console.log('React.StrictMode available:', !!StrictMode);
console.log('React.createRoot available:', !!createRoot);

const container = document.getElementById("root");
if (!container) {
  console.error('Root element not found!');
  throw new Error("Root element not found");
}

console.log('Root container found, initializing app...');

// Ensure DOM is fully ready
function initializeApp() {
  console.log('DOM ready, creating React root...');
  console.log('React available before root creation:', !!React);
  console.log('React version before root creation:', React.version);
  
  try {
    const root = createRoot(container);
    console.log('React root created successfully');
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    console.log('App rendered successfully');
  } catch (error) {
    console.error('Failed to render app:', error);
    console.error('React available during error:', !!React);
    console.error('React version during error:', React.version);
    throw error;
  }
}

if (document.readyState === 'loading') {
  console.log('DOM still loading, waiting...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  console.log('DOM already ready');
  initializeApp();
}
