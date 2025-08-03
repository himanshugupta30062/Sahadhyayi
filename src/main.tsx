
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSecurity } from './utils/security';

console.log('Main.tsx starting...');
console.log('React object before init:', React);

// CRITICAL: Ensure React is available globally BEFORE anything else initializes
// This must happen synchronously before any component or hook is loaded
if (typeof window !== 'undefined') {
  // Set React on window object
  (window as any).React = React;
  console.log('React set on window:', (window as any).React);
  
  // Also ensure React hooks are directly available on window
  (window as any).ReactHooks = {
    useState: React.useState,
    useEffect: React.useEffect,
    useContext: React.useContext,
    useCallback: React.useCallback,
    useMemo: React.useMemo,
    useRef: React.useRef,
    useReducer: React.useReducer,
  };
}

// Make React hooks available globally to prevent null reference errors
Object.assign(globalThis, {
  React,
  ReactHooks: {
    useState: React.useState,
    useEffect: React.useEffect,
    useContext: React.useContext,
    useCallback: React.useCallback,
    useMemo: React.useMemo,
    useRef: React.useRef,
    useReducer: React.useReducer,
  }
});

// Strict verification that React is properly initialized
if (!React || typeof React.createElement !== 'function') {
  console.error('React is not properly initialized!');
  throw new Error('React initialization failed - cannot proceed');
}

if (!React.useState || !React.useEffect || !React.useContext) {
  console.error('React hooks are not properly initialized!');
  throw new Error('React hooks initialization failed - cannot proceed');
}

console.log('React hooks verified:', {
  useState: !!React.useState,
  useEffect: !!React.useEffect,
  useContext: !!React.useContext,
  useRef: !!React.useRef,
});

// Initialize security measures after React is ready
initializeSecurity();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

console.log('Creating root with React:', !!React);

// Simple, direct render without complex fallbacks that might cause issues
const renderApp = () => {
  try {
    // Final verification React is still available at render time
    if (!React || !React.createElement || !React.useState) {
      console.error('React became unavailable before render');
      // Simple reload if React is not available
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
