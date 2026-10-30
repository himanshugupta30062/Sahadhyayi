import React, { ReactNode, FC, memo } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verifyAdminStatus } from '@/utils/catalog/duplicateResolution';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/AdminLayout';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminLoadingSkeleton = memo(() => (
  <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  </div>
));

AdminLoadingSkeleton.displayName = 'AdminLoadingSkeleton';

export const AdminRoute: FC<AdminRouteProps> = memo(({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['is-admin-route-guard', user?.id],
    enabled: !!user,
    queryFn: verifyAdminStatus,
    staleTime: 5 * 60 * 1000,
  });

  // 1. Loading state while checking authentication or admin role
  if (authLoading || (!!user && adminLoading)) {
    return <AdminLoadingSkeleton />;
  }

  // 2. Redirect unauthenticated users to sign-in
  if (!user) {
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/signin?redirect=${encodeURIComponent(redirect)}`}
        state={{ from: redirect }}
        replace
      />
    );
  }

  // 3. Deny access to authenticated non-admins
  if (isAdmin !== true) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Administrator Access Required</h2>
          <p className="text-sm text-slate-600">
            This area is restricted to authorized platform administrators. Your account does not have the required administrative permissions.
          </p>
          <div className="pt-2">
            <Button asChild variant="outline" className="w-full">
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized administrator
  return <AdminLayout>{children}</AdminLayout>;
});

AdminRoute.displayName = 'AdminRoute';

export default AdminRoute;

