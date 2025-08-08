import { useCallback, useEffect, useState } from 'react';
import { secureFetch } from '@/utils/security';

function getSupabaseAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('sb-access-token');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const res = await secureFetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUserId(data?.id ?? null);
      } else {
        setUserId(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (supabaseAccessToken?: string) => {
      const token = supabaseAccessToken || getSupabaseAccessToken();
      if (!token) throw new Error('Missing Supabase access token');
      const res = await secureFetch('/api/session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || 'Login failed');
      }
      await check();
    },
    [check]
  );

  const logout = useCallback(async () => {
    await secureFetch('/api/logout', { method: 'POST' });
    setUserId(null);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { userId, loading, check, login, logout };
}
