import { getCsrfToken, setCsrfToken } from "./useSecureApi";
import { sessionClientLogin } from "./sessionClient";

/**
 * Wraps fetch:
 *  - includes credentials for cookie-based session
 *  - attaches X-CSRF-Token from localStorage
 *  - if 401/403, re-login via /api/session once, then retry the original request
 *  - if server rotates CSRF and returns X-New-CSRF-Token, we persist it
 */
export async function secureFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  // first attempt
  let res = await doFetch(input, init);
  // handle rotation header
  res = await maybePersistRotatedCsrfAndReturn(input, init, res);

  if (res.status === 401 || res.status === 403) {
    // refresh server session + CSRF
    try {
      await sessionClientLogin();
      // retry once with fresh token
      const res2 = await doFetch(input, init);
      return maybePersistRotatedCsrfAndReturn(input, init, res2);
    } catch {
      return res;
    }
  }

  return res;
}

async function doFetch(input: RequestInfo | URL, init: RequestInit) {
  const headers = new Headers(init.headers || {});
  const csrf = getCsrfToken();
  if (csrf) headers.set("X-CSRF-Token", csrf);

  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}

async function maybePersistRotatedCsrfAndReturn(
  input: RequestInfo | URL,
  init: RequestInit,
  res: Response
) {
  const newToken = res.headers.get("X-New-CSRF-Token");
  if (newToken) setCsrfToken(newToken);
  return res;
}
