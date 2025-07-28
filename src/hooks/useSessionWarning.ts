
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before timeout
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes total

export const useSessionWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const { user } = useAuth();

  const extendSession = useCallback(() => {
    setShowWarning(false);
    setTimeRemaining(0);
    
    // Update last activity timestamp
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      return;
    }

    const checkSessionTimeout = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (!lastActivity) return;

      const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
      const timeUntilTimeout = INACTIVITY_TIMEOUT - timeSinceLastActivity;

      if (timeUntilTimeout <= WARNING_TIME && timeUntilTimeout > 0) {
        setShowWarning(true);
        setTimeRemaining(Math.floor(timeUntilTimeout / 1000));
      } else if (timeUntilTimeout <= 0) {
        setShowWarning(false);
      } else {
        setShowWarning(false);
      }
    };

    // Check immediately
    checkSessionTimeout();

    // Check every 30 seconds
    const interval = setInterval(checkSessionTimeout, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return {
    showWarning,
    timeRemaining,
    extendSession
  };
};
