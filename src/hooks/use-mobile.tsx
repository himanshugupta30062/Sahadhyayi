
import React, { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  console.log('useIsMobile hook called...');
  
  // Enhanced safety check with fallback
  const reactInstance = React || (globalThis as any).React || (typeof window !== 'undefined' ? (window as any).React : null);
  
  if (!reactInstance || typeof reactInstance.useState !== 'function') {
    console.error('React hooks not available in useIsMobile');
    return false;
  }

  try {
    const [isMobile, setIsMobile] = reactInstance.useState<boolean | undefined>(undefined)

    reactInstance.useEffect(() => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
      mql.addEventListener("change", onChange)
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return () => mql.removeEventListener("change", onChange)
    }, [])

    return !!isMobile
  } catch (error) {
    console.error('Error in useIsMobile:', error);
    return false;
  }
}
