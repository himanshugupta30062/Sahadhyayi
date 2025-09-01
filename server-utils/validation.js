// src/utils/validation.ts
var encodeHTML = (str) => {
  const entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;"
  };
  return String(str).replace(/[&<>"'`=/]/g, (s) => entityMap[s]);
};
var sanitizeHTML = (dirty) => {
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/javascript:/gi, "");
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  clean = clean.replace(/\s*style\s*=\s*["'][^"']*["']/gi, "");
  clean = clean.replace(/data:(?!image\/)[^;]+;/gi, "");
  return encodeHTML(clean);
};
var validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  if (trimmed.includes("..") || trimmed.startsWith(".") || trimmed.endsWith(".")) return false;
  return emailRegex.test(trimmed);
};
var validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { isValid: false, message: "Password is required" };
  }
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  if (password.length > 128) {
    return { isValid: false, message: "Password must be less than 128 characters long" };
  }
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    };
  }
  const weakPatterns = [
    /(.)\1{2,}/,
    // Repeated characters (aaa, 111)
    /^(?:password|123456|qwerty|abc123|admin|user|guest|test)/i,
    // Common passwords
    /^\d+$/,
    // Only numbers
    /^[a-zA-Z]+$/
    // Only letters
  ];
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return { isValid: false, message: "Password is too weak. Avoid common patterns." };
    }
  }
  return { isValid: true };
};
var validateUsername = (username) => {
  if (!username || typeof username !== "string") {
    return { isValid: false, message: "Username is required" };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { isValid: false, message: "Username must be at least 3 characters long" };
  }
  if (trimmed.length > 30) {
    return { isValid: false, message: "Username must be less than 30 characters long" };
  }
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return {
      isValid: false,
      message: "Username can only contain letters, numbers, underscores, and hyphens"
    };
  }
  const reservedNames = ["admin", "root", "user", "guest", "test", "api", "www", "mail", "ftp", "localhost", "system"];
  if (reservedNames.includes(trimmed.toLowerCase())) {
    return { isValid: false, message: "This username is reserved" };
  }
  return { isValid: true };
};
var sanitizeInput = (input, maxLength) => {
  if (!input || typeof input !== "string") return "";
  let sanitized = input.replace(/[<>]/g, "").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "").replace(/data:(?!image\/)[^;]+;/gi, "").trim();
  sanitized = encodeHTML(sanitized);
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
};
var sanitizeSearchQuery = (query) => {
  if (!query || typeof query !== "string") return "";
  return query.trim().replace(/[<>'"&;(){}]/g, "").replace(/\s+/g, " ").substring(0, 100);
};
var validateTextLength = (text, minLength, maxLength) => {
  if (!text || typeof text !== "string") {
    return { isValid: false, message: "Text is required" };
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
var isValidUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  try {
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};
var isRateLimited = (key, maxAttempts, windowMs) => {
  if (typeof window === "undefined") return false;
  const now = Date.now();
  const storageKey = `rate_limit_${key}`;
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    localStorage.setItem(storageKey, JSON.stringify({ count: 1, firstAttempt: now }));
    return false;
  }
  try {
    const data = JSON.parse(stored);
    if (now - data.firstAttempt > windowMs) {
      localStorage.setItem(storageKey, JSON.stringify({ count: 1, firstAttempt: now }));
      return false;
    }
    if (data.count >= maxAttempts) {
      return true;
    }
    data.count++;
    localStorage.setItem(storageKey, JSON.stringify(data));
    return false;
  } catch {
    localStorage.setItem(storageKey, JSON.stringify({ count: 1, firstAttempt: now }));
    return false;
  }
};
var validateCSP = (content) => {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i
  ];
  return !dangerousPatterns.some((pattern) => pattern.test(content));
};
export {
  encodeHTML,
  isRateLimited,
  isValidUrl,
  sanitizeHTML,
  sanitizeInput,
  sanitizeSearchQuery,
  validateCSP,
  validateEmail,
  validatePassword,
  validateTextLength,
  validateUsername
};
