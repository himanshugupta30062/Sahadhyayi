import { useCallback } from 'react';
import { secureFetch, setCSRFToken } from '@/utils/security';

export function useSecureApi() {
  const login = useCallback(async (accessToken: string) => {
    const res = await secureFetch('/api/session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data?.csrfToken) {
      setCSRFToken(data.csrfToken);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    await secureFetch('/api/logout', { method: 'POST' });
  }, []);

  const fetcher = useCallback(
    (url: string, opts?: RequestInit) => secureFetch(url, opts),
    []
  );

  return { login, logout, fetcher };
}
