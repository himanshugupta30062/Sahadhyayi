import React, { ReactNode, FC, memo } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
}

const LoadingSkeleton = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-background via-brand-neutral to-background p-8">
    <div className="max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  </div>
));

const OptimizedProtectedRoute: FC<ProtectedRouteProps> = memo(({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    // Save scroll position for restoration after login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectScrollY', String(window.scrollY));
    }
    
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/signin?redirect=${encodeURIComponent(redirect)}`}
        state={{ from: redirect }}
        replace
      />
    );
  }

  return <>{children}</>;
});

OptimizedProtectedRoute.displayName = 'OptimizedProtectedRoute';

export default OptimizedProtectedRoute;