import { getCsrfToken } from './useSecureApi';

/**
 * Wrapper around fetch that automatically includes credentials and the
 * CSRF token header when available.
 */
export async function secureFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers.set('x-csrf-token', csrfToken);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res;
}
