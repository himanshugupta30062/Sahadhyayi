import { useAuth as useBaseAuth } from './AuthContext';
import type { AuthError, Provider } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client-universal';

export const normalizeAuthEmail = (email: string): string =>
  email.trim().toLowerCase();

export const normalizeAuthName = (name: string): string =>
  name
    // eslint-disable-next-line no-control-regex
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
  ): Promise<{ error: AuthError | null; requiresEmailVerification: boolean; emailMayAlreadyExist: boolean }> => {
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
        requiresEmailVerification: false,
        emailMayAlreadyExist: false,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        // Supabase should return users to the route that handles PKCE and OTP links.
        emailRedirectTo: `${window.location.origin}/confirm-email`,
        captchaToken,
        data: normalizedName ? { full_name: normalizedName } : undefined,
      },
    });
    // With email confirmations enabled, Supabase may intentionally return a
    // success-shaped response for an already-registered email. An empty
    // identities array is the documented client-side signal; do not query
    // auth.users directly from the browser. Keep the UI wording non-definitive
    // to avoid disclosing whether a particular email is registered.
    const emailMayAlreadyExist = !error && Boolean(data.user) && Array.isArray(data.user.identities) && data.user.identities.length === 0;
    // Supabase returns a session when confirmation is disabled, and no session
    // while the user still needs to verify their email.
    return {
      error,
      requiresEmailVerification: !error && !emailMayAlreadyExist && Boolean(data.user) && !data.session,
      emailMayAlreadyExist,
    };
  };

  const signInWithOAuth = async (provider: Provider) => {
    const redirectTo = new URL('/auth/callback', window.location.origin);
    // Use a fixed same-origin destination; never accept arbitrary external redirect URLs.
    redirectTo.searchParams.set('next', '/dashboard');

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo.toString(),
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
