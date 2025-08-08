import { useCallback } from 'react';
import { secureFetch } from '@/utils/security';

export function useSecureApi() {
  const fetcher = useCallback((url: string, opts?: RequestInit) => secureFetch(url, opts), []);
  return { fetcher };
}
