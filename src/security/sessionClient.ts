import { setCsrfToken } from './useSecureApi';

/**
 * Establishes a secure session with the backend. On success the server
 * issues an HttpOnly session cookie and returns a CSRF token which is
 * stored via setCsrfToken.
 */
export async function sessionClientLogin() {
  const res = await fetch('/api/session', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) {
    throw new Error(`/api/session failed: ${res.status}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!data?.csrfToken) {
    throw new Error('No csrfToken in /api/session response');
  }
  setCsrfToken(data.csrfToken);
  return data.csrfToken as string;
}

/**
 * Clears the server-side session and local CSRF token.
 */
export async function sessionClientLogout() {
  try {
    await fetch('/api/session', { method: 'DELETE', credentials: 'include' });
  } finally {
    setCsrfToken(null);
  }
}
