
// Enhanced Input validation and sanitization utilities

// XSS Prevention: Comprehensive HTML entity encoding
export const encodeHTML = (str: string): string => {
  const entityMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return String(str).replace(/[&<>"'`=/]/g, (s) => entityMap[s]);
};

// Advanced XSS sanitization using DOMPurify-like approach
export const sanitizeHTML = (dirty: string): string => {
  // Remove script tags and their content
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove javascript: protocols
  clean = clean.replace(/javascript:/gi, '');
  
  // Remove on* event handlers
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove style attributes that could contain expressions
  clean = clean.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove data: protocols (except data:image)
  clean = clean.replace(/data:(?!image\/)[^;]+;/gi, '');
  
  // HTML encode the result
  return encodeHTML(clean);
};

export const validateEmail = (email: string): boolean => {
  // Enhanced email validation with additional security checks
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const trimmed = email.trim();
  
  // Check length constraints
  if (trimmed.length > 254) return false;
  
  // Check for potentially malicious patterns
  if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) return false;
  
  return emailRegex.test(trimmed);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters long' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    };
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /(.)\1{2,}/,  // Repeated characters (aaa, 111)
    /^(?:password|123456|qwerty|abc123|admin|user|guest|test)/i,  // Common passwords
    /^\d+$/,  // Only numbers
    /^[a-zA-Z]+$/  // Only letters
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return { isValid: false, message: 'Password is too weak. Avoid common patterns.' };
    }
  }
  
  return { isValid: true };
};

export const validateUsername = (username: string): { isValid: boolean; message?: string } => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, message: 'Username is required' };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters long' };
  }
  
  if (trimmed.length > 30) {
    return { isValid: false, message: 'Username must be less than 30 characters long' };
  }
  
  // Enhanced username validation - alphanumeric, underscore, hyphen only
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return { 
      isValid: false, 
      message: 'Username can only contain letters, numbers, underscores, and hyphens' 
    };
  }
  
  // Prevent reserved usernames
  const reservedNames = ['admin', 'root', 'user', 'guest', 'test', 'api', 'www', 'mail', 'ftp', 'localhost', 'system'];
  if (reservedNames.includes(trimmed.toLowerCase())) {
    return { isValid: false, message: 'This username is reserved' };
  }
  
  return { isValid: true };
};

// Enhanced input sanitization with comprehensive XSS prevention
export const sanitizeInput = (input: string, maxLength?: number): string => {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:(?!image\/)[^;]+;/gi, '') // Remove non-image data URLs
    .trim();
  
  // HTML encode dangerous characters
  sanitized = encodeHTML(sanitized);
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

// Search query sanitization to prevent injection attacks
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return '';
  
  return query
    .trim()
    .replace(/[<>'"&;(){}]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit length
};

export const validateTextLength = (text: string, minLength: number, maxLength: number): { isValid: boolean; message?: string } => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, message: 'Text is required' };
  }
  
  const trimmed = text.trim();
  
  if (trimmed.length < minLength) {
    return { isValid: false, message: `Text must be at least ${minLength} characters long` };
  }
  
  if (trimmed.length > maxLength) {
    return { isValid: false, message: `Text must be less than ${maxLength} characters long` };
  }
  
  return { isValid: true };
};

export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Prevent localhost and private IPs in production
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Rate limiting helper
export const isRateLimited = (key: string, maxAttempts: number, windowMs: number): boolean => {
  if (typeof window === 'undefined') return false;
  
  const now = Date.now();
  const storageKey = `rate_limit_${key}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) {
    localStorage.setItem(storageKey, JSON.stringify({ count: 1, firstAttempt: now }));
    return false;
  }
  
  try {
    const data = JSON.parse(stored);
    
    // Reset if window has passed
    if (now - data.firstAttempt > windowMs) {
      localStorage.setItem(storageKey, JSON.stringify({ count: 1, firstAttempt: now }));
      return false;
    }
    
    // Check if rate limited
    if (data.count >= maxAttempts) {
      return true;
    }
    
    // Increment counter
    data.count++;
    localStorage.setItem(storageKey, JSON.stringify(data));
    return false;
  } catch {
    // If parsing fails, reset
    localStorage.setItem(storageKey, JSON.stringify({ count: 1, firstAttempt: now }));
    return false;
  }
};

// Content Security Policy validation
export const validateCSP = (content: string): boolean => {
  // Check for potentially dangerous content that might bypass CSP
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(content));
};
