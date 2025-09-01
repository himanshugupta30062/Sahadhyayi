import { setCsrfToken } from "./useSecureApi";

/**
 * Calls the backend to initialize an authenticated session and
 * receive a CSRF token. This should be invoked after the client
 * logs in with Supabase so that the server session and CSRF token
 * stay in sync with the client.
 */
export async function sessionClientLogin(): Promise<void> {
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
}
