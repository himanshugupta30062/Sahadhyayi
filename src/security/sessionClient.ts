import { setCsrfToken } from "./useSecureApi";
import { supabase } from "@/integrations/supabase/client";

/** Call this to mint a fresh server session + csrf, without React hooks */
export async function sessionClientLogin() {
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

  const backendBaseUrl = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/$/, "") || "";
  const res = await fetch(`${backendBaseUrl}/api/session`, {
    method: "POST",
    credentials: "include",
    headers,
    body: token ? JSON.stringify({ access_token: token }) : "{}",
  });
  if (!res.ok) throw new Error(`/api/session failed: ${res.status}`);
  const data = await res.json().catch(() => ({}));
  if (!data?.csrfToken) throw new Error("No csrfToken in /api/session response");
  setCsrfToken(data.csrfToken);
  return data.csrfToken as string;
}
