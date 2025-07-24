// Security configuration and middleware

export const SECURITY_CONFIG = {
  // Rate limiting configurations
  RATE_LIMITS: {
    SIGNIN: { attempts: 5, windowMs: 300000 }, // 5 attempts per 5 minutes
    SIGNUP: { attempts: 3, windowMs: 600000 }, // 3 attempts per 10 minutes
    SEARCH: { attempts: 10, windowMs: 60000 }, // 10 searches per minute
    COMMENT: { attempts: 20, windowMs: 300000 }, // 20 comments per 5 minutes
    PROFILE_UPDATE: { attempts: 5, windowMs: 300000 }, // 5 updates per 5 minutes
  },

  // Content Security Policy
  CSP: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'", 
      "'unsafe-inline'", // Required for React inline scripts
      "https://maps.googleapis.com",
      "https://www.google.com"
    ],
    'style-src': [
      "'self'", 
      "'unsafe-inline'", // Required for styled-components and CSS-in-JS
      "https://fonts.googleapis.com"
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    'img-src': [
      "'self'",
      "data:",
      "https:",
      "blob:"
    ],
    'connect-src': [
      "'self'",
      "https://*.supabase.co",
      "https://maps.googleapis.com"
    ],
    'frame-src': [
      "'self'",
      "https://www.google.com"
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  },

  // Input validation limits
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

  // File upload restrictions
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
    ALLOWED_DOCUMENT_TYPES: [
      'application/pdf',
      'text/plain',
      'application/json'
    ],
  },

  // Session security
  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    INACTIVITY_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
    RENEWAL_THRESHOLD: 30 * 60 * 1000, // 30 minutes
  },

  // Trusted domains for external links
  TRUSTED_DOMAINS: [
    'sahadhyayi.com',
    'www.sahadhyayi.com',
    'supabase.com',
    'github.com',
    'google.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'maps.googleapis.com'
  ],

  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  }
};

// Security middleware functions
export class SecurityMiddleware {
  static validateOrigin(origin: string): boolean {
    if (!origin) return false;
    
    try {
      const url = new URL(origin);
      return SECURITY_CONFIG.TRUSTED_DOMAINS.includes(url.hostname);
    } catch {
      return false;
    }
  }

  static sanitizeUserAgent(userAgent: string): string {
    if (!userAgent || typeof userAgent !== 'string') return 'Unknown';
    
      return userAgent
        .replace(/[<>'"&]/g, '')
        .substring(0, 200);
  }

  static validateReferer(referer: string): boolean {
    if (!referer) return true; // Allow empty referer
    
    try {
      const url = new URL(referer);
      return SECURITY_CONFIG.TRUSTED_DOMAINS.includes(url.hostname) ||
             url.hostname === window.location.hostname;
    } catch {
      return false;
    }
  }

  static createSecureRequestOptions(includeCredentials: boolean = true): RequestInit {
    const options: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...SECURITY_CONFIG.SECURITY_HEADERS
      }
    };

    if (includeCredentials) {
      options.credentials = 'same-origin';
    }

    return options;
  }

  static logSecurityViolation(violation: string, details: any = {}): void {
    const event = {
      type: 'SECURITY_VIOLATION',
      violation,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referer: document.referrer
    };

    console.warn('[SECURITY]', event);
    
    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToSecurityService(event);
    }
  }
}

// Security event monitoring
export class SecurityMonitor {
  private static events: any[] = [];
  private static readonly MAX_EVENTS = 100;

  static recordEvent(event: string, data: any = {}): void {
    const record = {
      event,
      data,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.events.push(record);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Check for suspicious patterns
    this.detectAnomalies();
  }

  private static detectAnomalies(): void {
    const recentEvents = this.events.filter(
      e => Date.now() - e.timestamp < 60000 // Last minute
    );

    // Detect rapid-fire requests
    if (recentEvents.length > 20) {
      SecurityMiddleware.logSecurityViolation('RAPID_REQUESTS', {
        count: recentEvents.length,
        timeframe: '1_minute'
      });
    }

    // Detect failed login patterns
    const failedLogins = recentEvents.filter(
      e => e.event === 'LOGIN_FAILED'
    ).length;

    if (failedLogins > 3) {
      SecurityMiddleware.logSecurityViolation('MULTIPLE_LOGIN_FAILURES', {
        count: failedLogins,
        timeframe: '1_minute'
      });
    }
  }

  static getSecuritySummary(): any {
    return {
      totalEvents: this.events.length,
      recentEvents: this.events.filter(
        e => Date.now() - e.timestamp < 300000 // Last 5 minutes
      ).length,
      eventTypes: [...new Set(this.events.map(e => e.event))]
    };
  }
}

export default SECURITY_CONFIG;
