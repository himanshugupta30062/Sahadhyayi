import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Start every route at its top; stale per-route offsets can make new pages open mid-scroll.
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      // Scrolling is an enhancement; it must not break route rendering.
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
