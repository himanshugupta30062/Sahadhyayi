
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  console.log('ScrollToTop component rendering...');
  
  // Add safety check for React hooks
  if (!React || typeof React.useEffect !== 'function') {
    console.error('React hooks not available in ScrollToTop');
    return null;
  }

  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const stored = sessionStorage.getItem(`scroll-${pathname}`);
    const y = stored ? parseInt(stored, 10) : 0;
    window.scrollTo({ top: y, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
