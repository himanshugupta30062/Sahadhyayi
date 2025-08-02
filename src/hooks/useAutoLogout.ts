
import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const LAST_ACTIVITY_KEY = 'lastActivity';
const SESSION_START_KEY = 'sessionStart';
const BROWSER_SESSION_KEY = 'browserSession';

export const useAutoLogout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = React.useRef(true);

  // Check if current page requires authentication
  const isProtectedRoute = React.useCallback(() => {
    const protectedRoutes = [
      '/dashboard',
      '/profile',
      '/groups',
      '/map',
      '/bookshelf',
      '/quotes',
      '/stories'
    ];
    
    return protectedRoutes.some(route => location.pathname.startsWith(route));
  }, [location.pathname]);

  // Handle logout due to inactivity
  const handleInactivityLogout = React.useCallback(async () => {
    if (!user || !isProtectedRoute()) return;

    try {
      await signOut();
      
      // Clear all session data
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(BROWSER_SESSION_KEY);
      
      // Show toast notification
      toast.error('You have been logged out due to inactivity.', {
        duration: 5000,
      });
      
      // Redirect to signin page with original location
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectScrollY', String(window.scrollY));
      }
      const redirect = `${location.pathname}${location.search}${location.hash}`;
      navigate(`/signin?redirect=${encodeURIComponent(redirect)}`, { replace: true, state: { from: redirect } });
    } catch (error) {
      console.error('[AUTO-LOGOUT] Error during auto logout:', error);
    }
  }, [user, signOut, navigate, isProtectedRoute]);

  // Handle logout due to session timeout
  const handleSessionTimeout = React.useCallback(async () => {
    if (!user || !isProtectedRoute()) return;

    try {
      await signOut();
      
      // Clear all session data
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(BROWSER_SESSION_KEY);
      
      // Show toast notification
      toast.error('Your session has expired. Please log in again.', {
        duration: 5000,
      });
      
      // Redirect to signin page with original location
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectScrollY', String(window.scrollY));
      }
      const redirect2 = `${location.pathname}${location.search}${location.hash}`;
      navigate(`/signin?redirect=${encodeURIComponent(redirect2)}`, { replace: true, state: { from: redirect2 } });
    } catch (error) {
      console.error('[AUTO-LOGOUT] Error during session timeout:', error);
    }
  }, [user, signOut, navigate, isProtectedRoute]);

  // Check if browser session is valid
  const checkBrowserSession = React.useCallback(() => {
    if (!user || !isProtectedRoute()) return true;

    const browserSessionId = localStorage.getItem(BROWSER_SESSION_KEY);
    const sessionSessionId = sessionStorage.getItem(BROWSER_SESSION_KEY);
    
    // If no session storage ID but localStorage has one, it means browser was reopened
    if (browserSessionId && !sessionSessionId) {
      handleInactivityLogout();
      return false;
    }
    
    return true;
  }, [user, isProtectedRoute, handleInactivityLogout]);

  // Reset the inactivity timer
  const resetTimer = React.useCallback(() => {
    if (!user || !isProtectedRoute()) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity timestamp
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      handleInactivityLogout();
    }, INACTIVITY_TIMEOUT);

  }, [user, handleInactivityLogout, isProtectedRoute]);

  // Setup session timeout
  const setupSessionTimeout = React.useCallback(() => {
    if (!user || !isProtectedRoute()) return;

    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    const now = Date.now();

    if (!sessionStart) {
      // First time login, set session start
      localStorage.setItem(SESSION_START_KEY, now.toString());
      
      // Set session timeout
      sessionTimeoutRef.current = setTimeout(() => {
        handleSessionTimeout();
      }, SESSION_TIMEOUT);
    } else {
      const sessionAge = now - parseInt(sessionStart, 10);
      
      if (sessionAge > SESSION_TIMEOUT) {
        // Session has expired
        handleSessionTimeout();
        return;
      }
      
      // Set timeout for remaining session time
      const remainingTime = SESSION_TIMEOUT - sessionAge;
      sessionTimeoutRef.current = setTimeout(() => {
        handleSessionTimeout();
      }, remainingTime);
    }
  }, [user, isProtectedRoute, handleSessionTimeout]);

  // Activity event handlers
  const handleActivity = React.useCallback(() => {
    if (isActiveRef.current) {
      resetTimer();
    }
  }, [resetTimer]);

  // Handle page visibility change
  const handleVisibilityChange = React.useCallback(() => {
    if (document.hidden) {
      isActiveRef.current = false;
    } else {
      isActiveRef.current = true;
      
      // Check if browser session is still valid when page becomes visible
      if (checkBrowserSession()) {
        handleActivity();
      }
    }
  }, [checkBrowserSession, handleActivity]);

  // Handle page unload (browser close)
  const handleBeforeUnload = React.useCallback(() => {
    // Clear session storage to detect browser reopening
    sessionStorage.removeItem(BROWSER_SESSION_KEY);
  }, []);

  React.useEffect(() => {
    // Only activate auto-logout for authenticated users on protected routes
    if (!user || !isProtectedRoute()) {
      // Clear any existing timeouts if user logs out or leaves protected route
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(BROWSER_SESSION_KEY);
      sessionStorage.removeItem(BROWSER_SESSION_KEY);
      return;
    }


    // Generate unique session ID for browser session tracking
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(BROWSER_SESSION_KEY, sessionId);
    sessionStorage.setItem(BROWSER_SESSION_KEY, sessionId);

    // Check if session is still valid
    if (!checkBrowserSession()) {
      return;
    }

    // Check for existing activity and session timeout
    const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
      handleInactivityLogout();
      return;
    }

    // Setup session timeout
    setupSessionTimeout();

    // Start the inactivity timer
    resetTimer();

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle page unload (browser close)
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }

    };
  }, [user, handleActivity, resetTimer, isProtectedRoute, handleInactivityLogout, handleVisibilityChange, handleBeforeUnload, checkBrowserSession, setupSessionTimeout]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  return {
    resetTimer,
    isActive: isActiveRef.current,
    forceLogout: handleInactivityLogout
  };
};
