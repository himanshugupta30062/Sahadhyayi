import { useCallback } from "react";

const CSRF_KEY = "csrfToken";

export function getCsrfToken() {
  return (typeof window !== "undefined" && localStorage.getItem(CSRF_KEY)) || "";
}

export function setCsrfToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) localStorage.removeItem(CSRF_KEY);
  else localStorage.setItem(CSRF_KEY, token);
}

/**
 * Calls /api/session to (re)issue:
 *  - HttpOnly session cookie (server-managed)
 *  - CSRF token (returned in JSON)
 */
export function useSecureApi() {
  const login = useCallback(async () => {
    const res = await fetch("/api/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) throw new Error(`/api/session failed: ${res.status}`);
    const data = await res.json().catch(() => ({}));
    if (!data?.csrfToken) throw new Error("No csrfToken in /api/session response");
    setCsrfToken(data.csrfToken);
    return data.csrfToken as string;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/session", { method: "DELETE", credentials: "include" });
    } finally {
      setCsrfToken(null);
    }
  }, []);

  return { login, logout };
}
