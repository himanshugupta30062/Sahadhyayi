import { useAuth } from '@/contexts/AuthContext';

export const useIsAdmin = () => {
  const { user } = useAuth();
  return user?.user_metadata?.role === 'admin';
};
