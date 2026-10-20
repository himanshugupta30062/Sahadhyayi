import { useAuth as useBaseAuth } from './AuthContext';
import type { AuthError, Provider } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client-universal';

export const normalizeAuthEmail = (email: string): string =>
  email.trim().toLowerCase();

export const normalizeAuthName = (name: string): string =>
  name
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);

export const useAuth = () => {
  const base = useBaseAuth();

  const signUp = async (
    email: string,
    password: string,
    fullName: string | undefined,
    captchaToken: string
  ): Promise<{ error: AuthError | null }> => {
    // Do not HTML-encode identity fields. React escapes rendered text, and
    // HTML entities would change valid email local-parts (for example '&' or '/').
    const normalizedEmail = normalizeAuthEmail(email);
    const normalizedName = fullName ? normalizeAuthName(fullName) : '';

    if (!captchaToken.trim()) {
      return {
        error: {
          name: 'CaptchaRequiredError',
          message: 'Please complete the anti-bot verification before signing up.',
          status: 400,
        } as AuthError,
      };
    }

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        // Supabase should return users to the route that handles PKCE and OTP links.
        emailRedirectTo: `${window.location.origin}/confirm-email`,
        captchaToken,
        data: normalizedName ? { full_name: normalizedName } : undefined,
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

  return { ...base, signUp, signInWithOAuth, resetPassword } as const;
};

export type { AuthError };
