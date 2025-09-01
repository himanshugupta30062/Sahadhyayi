import { useCallback } from "react";
import { secureFetch } from "./secureFetch";
import { sessionClientLogin } from "./sessionClient";

const CSRF_KEY = "csrfToken";

export function getCsrfToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CSRF_KEY) || "";
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
    try {
      return await sessionClientLogin();
    } catch {
      throw new Error("SESSION_INIT_FAILED");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await secureFetch("/api/session", { method: "DELETE" });
    } finally {
      setCsrfToken(null);
    }
  }, []);

  return { login, logout };
}
