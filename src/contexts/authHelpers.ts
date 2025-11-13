import { useAuth as useBaseAuth } from './AuthContext';
import type { AuthError, Provider } from '@supabase/supabase-js';
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

  const signInWithOAuth = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  // Backward compatibility: expose a loading flag if callers expect it
  const loading = false as const;

  return { ...base, signUp, signInWithOAuth, resetPassword, loading } as const;
};

export type { AuthError };