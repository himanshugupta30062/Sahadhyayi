import { createSecureHeaders } from '@/utils/security';

export async function secureFetch(input: string, init: RequestInit = {}) {
  init.headers = { ...(init.headers || {}), ...createSecureHeaders(true) };
  (init as any).credentials = 'include';
  const res = await fetch(input, init);
  return res;
}
