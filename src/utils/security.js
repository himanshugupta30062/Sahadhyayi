// Minimal JS shim used ONLY by the server import.
// It implements the function server.js actually uses: validateFileUpload.
// Add small helpers in case they’re referenced.
export function validateFileUpload(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
  if (!file) return { valid: false, error: 'No file provided' };
  if (typeof file.size === 'number' && file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit` };
  }
  if (Array.isArray(allowedTypes) && allowedTypes.length > 0) {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }
  }
  // Optional extension/MIME sanity (won’t block if missing):
  try {
    const ext = String(file.name || '').split('.').pop()?.toLowerCase();
    const map = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'application/pdf': ['pdf'],
      'text/plain': ['txt'],
      'application/json': ['json'],
    };
    const expected = map[file.type];
    if (expected && ext && !expected.includes(ext)) {
      return { valid: false, error: 'File extension does not match content type' };
    }
  } catch {
    /* noop */
  }
  return { valid: true };
}

// Optional stubs used by some client code. Safe no-ops on server.
export function createSecureHeaders(includeCSRF = true) {
  const h = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  return h;
}
