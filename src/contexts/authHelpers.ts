import { useAuth as useBaseAuth } from './AuthContext';
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client-universal';

export const useAuth = () => {
  const base = useBaseAuth();

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ error: AuthError | null }> => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: fullName ? { full_name: fullName } : undefined,
      },
    });
    return { error };
  };

  // Backward compatibility: expose a loading flag if callers expect it
  const loading = false as const;

  return { ...base, signUp, loading } as const;
};

export type { AuthError };