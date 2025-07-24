import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
