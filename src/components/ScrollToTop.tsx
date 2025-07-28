import * as React from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
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
