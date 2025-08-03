
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Main.tsx starting...');
console.log('React available:', !!React);

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

// Simple, direct rendering without complex defensive checks
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log('App rendered successfully');
