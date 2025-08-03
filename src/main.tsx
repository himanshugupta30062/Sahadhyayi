
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Main.tsx starting...');

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

// Ensure DOM is fully ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  console.log('Initializing app...');
  
  const root = createRoot(container);
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  console.log('App rendered successfully');
}
