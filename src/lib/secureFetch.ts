import { createSecureHeaders } from '@/utils/security';
import { toAppError, safeJson } from './errors';

export async function secureFetch(input: string, init: RequestInit = {}) {
  const secureHeaders = createSecureHeaders(true);
  if (init.body instanceof FormData) {
    delete (secureHeaders as any)['Content-Type'];
  }
  init.headers = { ...secureHeaders, ...(init.headers || {}) };
  (init as any).credentials = 'include';

  try {
    const res = await fetch(input, init);
    if (!res.ok) {
      const body = await safeJson(res);
      const err = toAppError(
        {
          message: body?.error || `HTTP ${res.status} on ${input}`,
          status: res.status,
          code: body?.code,
          details: body?.details
        },
        { severity: res.status >= 500 ? 'critical' : 'high', context: { url: input, method: init.method || 'GET' } }
      );
      throw err;
    }
    return res;
  } catch (e) {
    throw toAppError(e, { severity: 'network', context: { url: input, method: init.method || 'GET' } });
  }
}
