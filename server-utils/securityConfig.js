export const SECURITY_CONFIG = {
  RATE_LIMITS: {
    SIGNIN: { attempts: 5, windowMs: 300000 },
    SIGNUP: { attempts: 3, windowMs: 600000 },
    SEARCH: { attempts: 10, windowMs: 60000 },
    COMMENT: { attempts: 20, windowMs: 300000 },
    PROFILE_UPDATE: { attempts: 5, windowMs: 300000 },
  },

  CSP: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'blob:',
      'https://maps.googleapis.com',
      'https://static.cloudflareinsights.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'https://*.supabase.co', 'wss:'],
    'frame-src': ["'self'"],
    'report-uri': ['/csp-report']
  },

  VALIDATION: {
    EMAIL_MAX_LENGTH: 254,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    NAME_MAX_LENGTH: 100,
    USERNAME_MAX_LENGTH: 30,
    SEARCH_QUERY_MAX_LENGTH: 100,
    COMMENT_MAX_LENGTH: 1000,
    DESCRIPTION_MAX_LENGTH: 2000,
  },

  FILE_UPLOAD: {
    ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
    MAX_SIZE: 5 * 1024 * 1024
  },

  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000,
    INACTIVITY_TIMEOUT: 2 * 60 * 60 * 1000,
    RENEWAL_THRESHOLD: 30 * 60 * 1000,
  },

  TRUSTED_DOMAINS: [
    'self',
    '*.supabase.co',
    'maps.googleapis.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ],

  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  }
};
