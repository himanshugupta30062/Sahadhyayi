import { setCsrfToken } from "./useSecureApi";

/** Call this to mint a fresh server session + csrf, without React hooks */
export async function sessionClientLogin() {
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
}
