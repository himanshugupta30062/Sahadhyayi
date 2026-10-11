import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackAnalyticsEvent } from '@/lib/analytics';

const usePageVisitTracker = () => {
  const location = useLocation();
  useEffect(() => {
    void trackAnalyticsEvent('pageview', undefined, location.pathname);
  }, [location.pathname]);
};

export default usePageVisitTracker;
