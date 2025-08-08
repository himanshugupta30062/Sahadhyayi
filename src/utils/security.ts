// Security utilities for comprehensive protection

// CSRF Token Generation and Validation
export function generateCSRFToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/=/g, '');
}

export function setCSRFToken(token: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('csrfToken', token);
  document.cookie = `csrfToken=${token}; Path=/; SameSite=Strict; Secure`;
}

export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null;
  const s = sessionStorage.getItem('csrfToken');
  if (s) return s;
  const m = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function clearCSRFToken() {
  sessionStorage.removeItem('csrfToken');
  document.cookie = `csrfToken=; Path=/; Max-Age=0; SameSite=Strict; Secure`;
}

export function validateCSRFToken(token: string): boolean {
  const storedToken = getCSRFToken();
  return storedToken !== null && storedToken === token;
}

// Security Headers Management
export const setSecurityHeaders = (): void => {
  if (typeof document === 'undefined') return;

  // Content Security Policy
  const cspContent = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://www.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://maps.googleapis.com",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ');

  // Create or update CSP meta tag
  let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!cspMeta) {
    cspMeta = document.createElement('meta');
    cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
    document.head.appendChild(cspMeta);
  }
  cspMeta.setAttribute('content', cspContent);

  // X-Content-Type-Options
  let xContentTypeMeta = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
  if (!xContentTypeMeta) {
    xContentTypeMeta = document.createElement('meta');
    xContentTypeMeta.setAttribute('http-equiv', 'X-Content-Type-Options');
    xContentTypeMeta.setAttribute('content', 'nosniff');
    document.head.appendChild(xContentTypeMeta);
  }

  // X-Frame-Options
  let xFrameMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
  if (!xFrameMeta) {
    xFrameMeta = document.createElement('meta');
    xFrameMeta.setAttribute('http-equiv', 'X-Frame-Options');
    xFrameMeta.setAttribute('content', 'DENY');
    document.head.appendChild(xFrameMeta);
  }

  // Referrer Policy
  let referrerMeta = document.querySelector('meta[name="referrer"]');
  if (!referrerMeta) {
    referrerMeta = document.createElement('meta');
    referrerMeta.setAttribute('name', 'referrer');
    referrerMeta.setAttribute('content', 'strict-origin-when-cross-origin');
    document.head.appendChild(referrerMeta);
  }
};

// Access Control Helpers
export const checkUserAccess = (userId: string, resourceUserId: string): boolean => {
  return userId === resourceUserId;
};

export const checkResourcePermissions = (
  userId: string | null, 
  resourceUserId: string, 
  isPublic: boolean = false
): boolean => {
  if (isPublic) return true;
  if (!userId) return false;
  return checkUserAccess(userId, resourceUserId);
};

// Session Security
export const validateSessionIntegrity = (): boolean => {
  if (typeof window === 'undefined') return true;

  const sessionStart = localStorage.getItem('sessionStart');
  const browserSession = sessionStorage.getItem('browserSession');
  
  if (!sessionStart || !browserSession) {
    return false;
  }

  const sessionAge = Date.now() - parseInt(sessionStart);
  const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

  return sessionAge < maxSessionAge;
};

/* legacy session helpers removed */

// Input Validation Helpers
export const validateFileUpload = (file: File, allowedTypes: string[], maxSize: number): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeToExtension: { [key: string]: string[] } = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
    'text/plain': ['txt'],
    'application/json': ['json']
  };

  const expectedExtensions = mimeToExtension[file.type];
  if (expectedExtensions && extension && !expectedExtensions.includes(extension)) {
    return { valid: false, error: 'File extension does not match content type' };
  }

  return { valid: true };
};

// API Request Security
export const createSecureHeaders = (includeCSRF: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (includeCSRF) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return headers;
};

export function initializeSecureSession() {
  if (!getCSRFToken()) setCSRFToken(generateCSRFToken());
}

export function clearSecureSession() {
  clearCSRFToken();
}

export const isSecureContext = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  // Check if running in HTTPS
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

// Content Security
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};

export const validateImageSrc = (src: string): boolean => {
  if (!src) return false;
  
  try {
    const url = new URL(src, window.location.origin);
    
    // Allow same origin, data URLs for images, and trusted CDNs
    const allowedOrigins = [
      window.location.origin,
      'https://images.unsplash.com',
      'https://picsum.photos',
      'https://via.placeholder.com'
    ];
    
    return url.protocol === 'data:' && src.startsWith('data:image/') ||
           allowedOrigins.some(origin => url.origin === origin);
  } catch {
    return false;
  }
};

// Logging and Monitoring
export const logSecurityEvent = (event: string, details: any = {}): void => {
  if (process.env.NODE_ENV === 'production') {
    console.warn(`[SECURITY] ${event}`, details);
    
    // In a real application, you would send this to your security monitoring service
    // Example: sendToSecurityService({ event, details, timestamp: new Date().toISOString() });
  }
};

// Initialize security measures on app start
export const initializeSecurity = (): void => {
  setSecurityHeaders();
  
  if (!isSecureContext()) {
    logSecurityEvent('INSECURE_CONTEXT', { 
      protocol: window.location.protocol,
      hostname: window.location.hostname 
    });
  }
  
  // Prevent right-click in production
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());
  }
  
  // Detect developer tools (basic detection)
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > 200 || 
          window.outerWidth - window.innerWidth > 200) {
        logSecurityEvent('DEVTOOLS_DETECTED');
      }
    }, 1000);
  }
};