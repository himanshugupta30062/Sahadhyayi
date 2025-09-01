const encodeHTML = (str) => {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  return String(str).replace(/[&<>"'`=/]/g, s => entityMap[s]);
};

export const sanitizeHTML = (dirty) => {
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/data:(?!image\/)[^;]+;/gi, '');
  return encodeHTML(clean);
};

export const sanitizeInput = (input, maxLength) => {
  if (!input || typeof input !== 'string') return '';
  let sanitized = input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:(?!image\/)[^;]+;/gi, '')
    .trim();
  sanitized = encodeHTML(sanitized);
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
};
