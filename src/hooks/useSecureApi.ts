import { useCallback } from 'react';
import { secureFetch } from '@/lib/secureFetch';
import { supabase } from '@/integrations/supabase/client';
import { setCSRFToken, clearSecureSession } from '@/utils/security';

export function useSecureApi() {
  const fetcher = useCallback((url: string, opts?: RequestInit) => secureFetch(url, opts), []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) return { error };

    const res = await secureFetch('/api/session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    const body = await res.json();
    if (body?.csrfToken) setCSRFToken(body.csrfToken);
    return { user: data.user, error: null };
  }, []);

  const logout = useCallback(async () => {
    await secureFetch('/api/logout', { method: 'POST' });
    await supabase.auth.signOut();
    clearSecureSession();
  }, []);

  return { fetcher, login, logout };
}
