// Security utilities for comprehensive protection (client-side TS)
export const generateCSRFToken = (): string => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/=/g, '');
};

export const setCSRFToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (!token) {
    sessionStorage.removeItem('csrfToken');
    document.cookie = 'csrfToken=; Path=/; Max-Age=0; SameSite=Strict; Secure';
  } else {
    sessionStorage.setItem('csrfToken', token);
    document.cookie = `csrfToken=${token}; Path=/; SameSite=Strict; Secure`;
  }
};

export const getCSRFToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const s = sessionStorage.getItem('csrfToken');
  if (s) return s;
  const m = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export const clearCSRFToken = (): void => setCSRFToken(null);

export const validateFileUpload = (file: File, allowedTypes: string[] = [], maxSize = 5 * 1024 * 1024)
  : { valid: boolean; error?: string } => {
  if (!file) return { valid: false, error: 'No file provided' };
  if (file.size > maxSize) return { valid: false, error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit` };
  if (allowedTypes.length && !allowedTypes.includes(file.type)) return { valid: false, error: 'File type not allowed' };
  try {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const map: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/gif': ['gif'], 'image/webp': ['webp'],
      'application/pdf': ['pdf'], 'text/plain': ['txt'], 'application/json': ['json'],
    };
    const expected = map[file.type];
    if (expected && ext && !expected.includes(ext)) return { valid: false, error: 'File extension does not match content type' };
  } catch {
    /* noop */
  }
  return { valid: true };
};

export const createSecureHeaders = (includeCSRF: boolean = true): HeadersInit => {
  const headers: HeadersInit = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  if (includeCSRF) {
    const token = getCSRFToken();
    if (token) (headers as any)['X-CSRF-Token'] = token;
  }
  return headers;
};

// Additional helpers retained from previous implementation
export const initializeSecureSession = (): void => {
  if (typeof window === 'undefined') return;
  if (!getCSRFToken()) setCSRFToken(generateCSRFToken());
};

export const initializeSecurity = (): void => {
  initializeSecureSession();
};
