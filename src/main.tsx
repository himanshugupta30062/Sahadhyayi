
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Main.tsx: Starting application...');

const container = document.getElementById("root");
if (!container) {
  console.error('Root element not found!');
  throw new Error("Root element not found");
}

console.log('Root container found, initializing app...');

// Ensure DOM is fully ready
function initializeApp() {
  console.log('DOM ready, creating React root...');
  
  try {
    const root = createRoot(container);
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    console.log('App rendered successfully');
  } catch (error) {
    console.error('Failed to render app:', error);
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
