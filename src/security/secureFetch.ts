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
  let res = await doFetch(input, init);
  res = await maybePersistRotatedCsrfAndReturn(res);

  if (res.status === 401 || res.status === 403) {
    try {
      await sessionClientLogin();                 // NO React hooks here
      const res2 = await doFetch(input, init);
      return maybePersistRotatedCsrfAndReturn(res2);
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

async function maybePersistRotatedCsrfAndReturn(res: Response) {
  const newToken = res.headers.get("X-New-CSRF-Token");
  if (newToken) setCsrfToken(newToken);
  return res;
}

