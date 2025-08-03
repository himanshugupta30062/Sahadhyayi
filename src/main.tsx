
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSecurity } from './utils/security';

console.log('Main.tsx starting...');
console.log('React object before init:', React);

// CRITICAL: Ensure React is available globally BEFORE anything else initializes
// This must happen synchronously before any component or hook is loaded
const globalReact = React;

// Set React on window object immediately
if (typeof window !== 'undefined') {
  (window as any).React = globalReact;
  console.log('React set on window:', (window as any).React);
  
  // Also ensure React hooks are directly available on window
  (window as any).ReactHooks = {
    useState: globalReact.useState,
    useEffect: globalReact.useEffect,
    useContext: globalReact.useContext,
    useCallback: globalReact.useCallback,
    useMemo: globalReact.useMemo,
    useRef: globalReact.useRef,
    useReducer: globalReact.useReducer,
  };
}

// Make React hooks available globally to prevent null reference errors
Object.assign(globalThis, {
  React: globalReact,
  ReactHooks: {
    useState: globalReact.useState,
    useEffect: globalReact.useEffect,
    useContext: globalReact.useContext,
    useCallback: globalReact.useCallback,
    useMemo: globalReact.useMemo,
    useRef: globalReact.useRef,
    useReducer: globalReact.useReducer,
  }
});

// Ensure React doesn't get garbage collected or overwritten
Object.defineProperty(globalThis, 'React', {
  value: globalReact,
  writable: false,
  enumerable: true,
  configurable: false
});

// Strict verification that React is properly initialized
if (!globalReact || typeof globalReact.createElement !== 'function') {
  console.error('React is not properly initialized!');
  throw new Error('React initialization failed - cannot proceed');
}

if (!globalReact.useState || !globalReact.useEffect || !globalReact.useContext) {
  console.error('React hooks are not properly initialized!');
  throw new Error('React hooks initialization failed - cannot proceed');
}

console.log('React hooks verified:', {
  useState: !!globalReact.useState,
  useEffect: !!globalReact.useEffect,
  useContext: !!globalReact.useContext,
  useRef: !!globalReact.useRef,
});

// Initialize security measures after React is ready
initializeSecurity();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

console.log('Creating root with React:', !!globalReact);

// Simple, direct render
const renderApp = () => {
  try {
    // Final verification React is still available at render time
    if (!globalReact || !globalReact.createElement || !globalReact.useState) {
      console.error('React became unavailable before render');
      window.location.reload();
      return;
    }

    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
    // Simple fallback without StrictMode
    try {
      root.render(<App />);
      console.log('App rendered successfully (fallback)');
    } catch (fallbackError) {
      console.error('Fallback render also failed:', fallbackError);
      // Final fallback - reload page
      window.location.reload();
    }
  }
};

// Ensure DOM is ready before rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  // DOM is already ready
  renderApp();
}

// Service Worker registration (non-blocking)
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service Worker registration failed:', err);
    });
  });
} else {
  console.warn('Service Worker not registered: insecure context or unsupported browser');
}
