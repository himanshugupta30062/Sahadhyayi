
import React from 'react';

export const ensureReactIsGlobal = () => {
  // Ensure React is available globally for all components
  if (typeof window !== 'undefined' && !(window as any).React) {
    try {
      (window as any).React = React;
      (window as any).useState = React.useState;
      (window as any).useEffect = React.useEffect;
      (window as any).useContext = React.useContext;
      (window as any).useRef = React.useRef;
      (window as any).useCallback = React.useCallback;
      (window as any).useMemo = React.useMemo;
      (window as any).useReducer = React.useReducer;
      console.log('React made globally available');
    } catch (error) {
      console.warn('Could not make React global:', error);
    }
  }
  
  if (!(globalThis as any).React) {
    try {
      (globalThis as any).React = React;
      (globalThis as any).useState = React.useState;
      (globalThis as any).useEffect = React.useEffect;
      (globalThis as any).useContext = React.useContext;
      (globalThis as any).useRef = React.useRef;
      (globalThis as any).useCallback = React.useCallback;
      (globalThis as any).useMemo = React.useMemo;
      (globalThis as any).useReducer = React.useReducer;
      console.log('React made globally available on globalThis');
    } catch (error) {
      console.warn('Could not make React global on globalThis:', error);
    }
  }
};
