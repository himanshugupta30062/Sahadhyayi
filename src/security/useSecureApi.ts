import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      let token: string | undefined;
      try {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token;
      } catch {
        // Guest or unauthenticated session
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/session", {
        method: "POST",
        credentials: "include",
        headers,
        body: token ? JSON.stringify({ access_token: token }) : "{}",
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
