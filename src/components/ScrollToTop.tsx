
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  console.log('ScrollToTop component rendering...');
  
  try {
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
  } catch (error) {
    console.error('Error in ScrollToTop:', error);
    return null;
  }
};

export default ScrollToTop;
