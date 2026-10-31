import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Navigation must never fail because browser storage or scroll APIs are unavailable.
    let scrollY = 0;

    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
    } catch {
      // Some embedded/restricted browsers expose a read-only history object.
    }

    try {
      const stored = window.sessionStorage.getItem(`scroll-${pathname}`);
      const parsed = stored ? Number.parseInt(stored, 10) : 0;
      if (Number.isFinite(parsed) && parsed >= 0) {
        scrollY = parsed;
      }
    } catch {
      // Storage can throw SecurityError when disabled or blocked by browser policy.
    }

    try {
      window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
    } catch {
      // Scrolling is an enhancement; it must not break route rendering.
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
