export function generateCSRFToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/=/g, '');
}

export function setCSRFToken(token: string) {
  sessionStorage.setItem('csrfToken', token);
  document.cookie = `csrfToken=${token}; Path=/; SameSite=Strict; Secure`;
}

export function getCSRFToken(): string | null {
  const s = sessionStorage.getItem('csrfToken');
  if (s) return s;
  const m = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function clearCSRFToken() {
  sessionStorage.removeItem('csrfToken');
  document.cookie = `csrfToken=; Path=/; Max-Age=0; SameSite=Strict; Secure`;
}

export function createSecureHeaders(includeCSRF: boolean = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (includeCSRF) {
    const token = getCSRFToken();
    if (token) (headers as any)['X-CSRF-Token'] = token;
  }
  return headers;
}

export function initializeSecureSession() {
  if (!getCSRFToken()) setCSRFToken(generateCSRFToken());
}

export function clearSecureSession() {
  clearCSRFToken();
  // clear any client-side session markers if you use them
}
