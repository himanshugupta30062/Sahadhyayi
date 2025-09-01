// src/utils/security.ts
var generateCSRFToken = () => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/=/g, "");
};
var setCSRFToken = (token) => {
  if (typeof window === "undefined") return;
  if (!token) {
    sessionStorage.removeItem("csrfToken");
    document.cookie = "csrfToken=; Path=/; Max-Age=0; SameSite=Strict; Secure";
  } else {
    sessionStorage.setItem("csrfToken", token);
    document.cookie = `csrfToken=${token}; Path=/; SameSite=Strict; Secure`;
  }
};
var getCSRFToken = () => {
  if (typeof window === "undefined") return null;
  const s = sessionStorage.getItem("csrfToken");
  if (s) return s;
  const m = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};
var clearCSRFToken = () => setCSRFToken(null);
var validateFileUpload = (file, allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  var _a;
  if (!file) return { valid: false, error: "No file provided" };
  if (file.size > maxSize) return { valid: false, error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit` };
  if (allowedTypes.length && !allowedTypes.includes(file.type)) return { valid: false, error: "File type not allowed" };
  try {
    const ext = (_a = file.name.split(".").pop()) == null ? void 0 : _a.toLowerCase();
    const map = {
      "image/jpeg": ["jpg", "jpeg"],
      "image/png": ["png"],
      "image/gif": ["gif"],
      "image/webp": ["webp"],
      "application/pdf": ["pdf"],
      "text/plain": ["txt"],
      "application/json": ["json"]
    };
    const expected = map[file.type];
    if (expected && ext && !expected.includes(ext)) return { valid: false, error: "File extension does not match content type" };
  } catch {
  }
  return { valid: true };
};
var createSecureHeaders = (includeCSRF = true) => {
  const headers = { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" };
  if (includeCSRF) {
    const token = getCSRFToken();
    if (token) headers["X-CSRF-Token"] = token;
  }
  return headers;
};
var initializeSecureSession = () => {
  if (typeof window === "undefined") return;
  if (!getCSRFToken()) setCSRFToken(generateCSRFToken());
};
var initializeSecurity = () => {
  initializeSecureSession();
};
export {
  clearCSRFToken,
  createSecureHeaders,
  generateCSRFToken,
  getCSRFToken,
  initializeSecureSession,
  initializeSecurity,
  setCSRFToken,
  validateFileUpload
};
