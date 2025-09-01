// src/security/useSecureApi.ts
import { useCallback } from "react";
var CSRF_KEY = "csrfToken";
function getCsrfToken() {
  if (typeof window === "undefined")
    return "";
  try {
    return localStorage.getItem(CSRF_KEY) || "";
  } catch {
    return "";
  }
}
function setCsrfToken(token) {
  if (typeof window === "undefined")
    return;
  try {
    if (!token)
      localStorage.removeItem(CSRF_KEY);
    else
      localStorage.setItem(CSRF_KEY, token);
  } catch {
  }
}

// src/security/sessionClient.ts
async function sessionClientLogin() {
  const res = await fetch("/api/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  });
  if (!res.ok)
    throw new Error(`/api/session failed: ${res.status}`);
  const data = await res.json().catch(() => ({}));
  if (!(data == null ? void 0 : data.csrfToken))
    throw new Error("No csrfToken in /api/session response");
  setCsrfToken(data.csrfToken);
  return data.csrfToken;
}

// src/security/secureFetch.ts
async function secureFetch(input, init = {}) {
  let res = await doFetch(input, init);
  res = await maybePersistRotatedCsrfAndReturn(res);
  if (res.status === 401 || res.status === 403) {
    try {
      await sessionClientLogin();
      const res2 = await doFetch(input, init);
      return maybePersistRotatedCsrfAndReturn(res2);
    } catch {
      return res;
    }
  }
  return res;
}
async function doFetch(input, init) {
  const headers = new Headers(init.headers || {});
  const csrf = getCsrfToken();
  if (csrf)
    headers.set("X-CSRF-Token", csrf);
  return fetch(input, {
    ...init,
    headers,
    credentials: "include"
  });
}
async function maybePersistRotatedCsrfAndReturn(res) {
  const newToken = res.headers.get("X-New-CSRF-Token");
  if (newToken)
    setCsrfToken(newToken);
  return res;
}

// src/utils/libgenApi.ts
async function searchLibgen(query) {
  try {
    const res = await secureFetch(`/api/libgen?q=${encodeURIComponent(query)}`);
    return await res.json();
  } catch (error) {
    console.error("Error searching Libgen:", error);
    return {
      success: false,
      books: [],
      error: error instanceof Error ? error.message : "Failed to search Libgen"
    };
  }
}
export {
  searchLibgen
};
