
import { useEffect, useRef, useCallback } from 'react';
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Check if current page requires authentication
  const isProtectedRoute = useCallback(() => {
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
  const handleInactivityLogout = useCallback(async () => {
    if (!user || !isProtectedRoute()) return;

    try {
      console.log('[AUTO-LOGOUT] Logging out due to inactivity');
      await signOut();
      
      // Clear all session data
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(BROWSER_SESSION_KEY);
      
      // Show toast notification
      toast.error('You have been logged out due to inactivity.', {
        duration: 5000,
      });
      
      // Redirect to signin page with return URL and scroll position
      const nextUrl = `${location.pathname}${location.search}${location.hash}`;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('authRedirectScroll', String(window.scrollY));
      }
      navigate(`/signin?next=${encodeURIComponent(nextUrl)}`, { replace: true });
    } catch (error) {
      console.error('[AUTO-LOGOUT] Error during auto logout:', error);
    }
  }, [user, signOut, navigate, isProtectedRoute]);

  // Handle logout due to session timeout
  const handleSessionTimeout = useCallback(async () => {
    if (!user || !isProtectedRoute()) return;

    try {
      console.log('[AUTO-LOGOUT] Logging out due to session timeout');
      await signOut();
      
      // Clear all session data
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(BROWSER_SESSION_KEY);
      
      // Show toast notification
      toast.error('Your session has expired. Please log in again.', {
        duration: 5000,
      });
      
      // Redirect to signin page
      const nextUrl = `${location.pathname}${location.search}${location.hash}`;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('authRedirectScroll', String(window.scrollY));
      }
      navigate(`/signin?next=${encodeURIComponent(nextUrl)}`, { replace: true });
    } catch (error) {
      console.error('[AUTO-LOGOUT] Error during session timeout:', error);
    }
  }, [user, signOut, navigate, isProtectedRoute]);

  // Check if browser session is valid
  const checkBrowserSession = useCallback(() => {
    if (!user || !isProtectedRoute()) return true;

    const browserSessionId = localStorage.getItem(BROWSER_SESSION_KEY);
    const sessionSessionId = sessionStorage.getItem(BROWSER_SESSION_KEY);
    
    // If no session storage ID but localStorage has one, it means browser was reopened
    if (browserSessionId && !sessionSessionId) {
      console.log('[AUTO-LOGOUT] Browser was reopened, logging out');
      handleInactivityLogout();
      return false;
    }
    
    return true;
  }, [user, isProtectedRoute, handleInactivityLogout]);

  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
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

    console.log('[AUTO-LOGOUT] Timer reset - user activity detected');
  }, [user, handleInactivityLogout, isProtectedRoute]);

  // Setup session timeout
  const setupSessionTimeout = useCallback(() => {
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
  const handleActivity = useCallback(() => {
    if (isActiveRef.current) {
      resetTimer();
    }
  }, [resetTimer]);

  // Handle page visibility change
  const handleVisibilityChange = useCallback(() => {
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
  const handleBeforeUnload = useCallback(() => {
    // Clear session storage to detect browser reopening
    sessionStorage.removeItem(BROWSER_SESSION_KEY);
  }, []);

  useEffect(() => {
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

    console.log('[AUTO-LOGOUT] Activating enhanced auto-logout for protected route');

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

      console.log('[AUTO-LOGOUT] Cleanup completed');
    };
  }, [user, handleActivity, resetTimer, isProtectedRoute, handleInactivityLogout, handleVisibilityChange, handleBeforeUnload, checkBrowserSession, setupSessionTimeout]);

  // Cleanup on unmount
  useEffect(() => {
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
