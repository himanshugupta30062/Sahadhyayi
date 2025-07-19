
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useAutoLogout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      
      // Show toast notification
      toast.error('You have been logged out due to inactivity.', {
        duration: 5000,
      });
      
      // Redirect to signin page
      navigate('/signin', { replace: true });
    } catch (error) {
      console.error('[AUTO-LOGOUT] Error during auto logout:', error);
    }
  }, [user, signOut, navigate, isProtectedRoute]);

  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
    if (!user || !isProtectedRoute()) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      handleInactivityLogout();
    }, INACTIVITY_TIMEOUT);

    console.log('[AUTO-LOGOUT] Timer reset - user activity detected');
  }, [user, handleInactivityLogout, isProtectedRoute]);

  // Activity event handlers
  const handleActivity = useCallback(() => {
    if (isActiveRef.current) {
      resetTimer();
    }
  }, [resetTimer]);

  useEffect(() => {
    // Only activate auto-logout for authenticated users on protected routes
    if (!user || !isProtectedRoute()) {
      // Clear any existing timeout if user logs out or leaves protected route
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    console.log('[AUTO-LOGOUT] Activating auto-logout for protected route');
    
    // Start the timer when user is on a protected route
    resetTimer();

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
      } else {
        isActiveRef.current = true;
        handleActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      console.log('[AUTO-LOGOUT] Cleanup completed');
    };
  }, [user, handleActivity, resetTimer, isProtectedRoute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    resetTimer,
    isActive: isActiveRef.current
  };
};
