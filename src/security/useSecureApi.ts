import { useCallback } from "react";

const CSRF_KEY = "csrfToken";

export function getCsrfToken() {
  if (typeof window === "undefined") return "";
  try { return localStorage.getItem(CSRF_KEY) || ""; } catch { return ""; }
}

export function setCsrfToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (!token) localStorage.removeItem(CSRF_KEY);
    else localStorage.setItem(CSRF_KEY, token);
  } catch { /* empty */ }
}

/** React hook: call only inside components/providers */
export function useSecureApi() {
  const login = useCallback(async () => {
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) throw new Error("SESSION_INIT_FAILED");
      const data = await res.json().catch(() => ({}));
      if (!data?.csrfToken) throw new Error("SESSION_INIT_FAILED");
      setCsrfToken(data.csrfToken);
      return data.csrfToken as string;
    } catch {
      throw new Error("SESSION_INIT_FAILED");
    }
  }, []);

  const logout = useCallback(async () => {
    try { await fetch("/api/session", { method: "DELETE", credentials: "include" }); }
    finally { setCsrfToken(null); }
  }, []);

  return { login, logout };
}
