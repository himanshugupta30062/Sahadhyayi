export type GeminiHistoryItem = {
  role: 'user' | 'model';
  text: string;
};

export type GeminiCallResult = {
  ok: boolean;
  status: number;
  body: unknown;
  raw: string;
};

export type GeminiRetryOptions = {
  model: string;
  apiKey: string;
  history: GeminiHistoryItem[];
  latestPrompt: string;
  systemInstruction: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
};

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 2;
const MAX_RETRY_DELAY_MS = 3_000;

export function getSecureRandomInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 0x1_0000_0000) {
    throw new Error('maxExclusive must be a positive integer within the uint32 range.');
  }

  const rejectionLimit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  const random = new Uint32Array(1);
  do {
    crypto.getRandomValues(random);
  } while (random[0] >= rejectionLimit);

  return random[0] % maxExclusive;
}

export function secureShuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = getSecureRandomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getRetryDelay(response: Response, attempt: number): number {
  const retryAfterSeconds = Number.parseFloat(response.headers.get('retry-after') ?? '');
  const exponentialDelay = Math.min(2_000, 250 * 2 ** attempt);
  const serverDelay = Number.isFinite(retryAfterSeconds)
    ? Math.min(MAX_RETRY_DELAY_MS, Math.max(0, retryAfterSeconds * 1_000))
    : exponentialDelay;
  return serverDelay + getSecureRandomInt(150);
}

function getNetworkRetryDelay(attempt: number): number {
  return Math.min(2_000, 250 * 2 ** attempt) + getSecureRandomInt(150);
}

export async function callGeminiWithRetry(options: GeminiRetryOptions): Promise<GeminiCallResult> {
  const {
    model,
    apiKey,
    history,
    latestPrompt,
    systemInstruction,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch,
    sleep = defaultSleep,
  } = options;

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [
      ...history.map((item) => ({ role: item.role, parts: [{ text: item.text }] })),
      { role: 'user', parts: [{ text: latestPrompt }] },
    ],
    generationConfig: {
      thinkingConfig: { thinkingLevel: 'medium' },
      maxOutputTokens: 1_000,
    },
  });

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let retryDelayMs = 0;

    try {
      const response = await fetchImpl(
        'https://generativelanguage.googleapis.com/v1beta/models/' +
          encodeURIComponent(model) + ':generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: requestBody,
          signal: controller.signal,
        },
      );
      const raw = await response.text();

      if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_ATTEMPTS - 1) {
        retryDelayMs = getRetryDelay(response, attempt);
        console.warn('Gemini returned a retryable status; retrying once.', {
          status: response.status,
          attempt: attempt + 1,
        });
      } else {
        let body: unknown = null;
        try {
          body = JSON.parse(raw);
        } catch {
          body = null;
        }
        return { ok: response.ok, status: response.status, body, raw: raw.slice(0, 1_800) };
      }
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS - 1) {
        throw error;
      }
      retryDelayMs = getNetworkRetryDelay(attempt);
      console.warn('Gemini request failed; retrying once.', {
        name: error instanceof Error ? error.name : 'UnknownError',
        attempt: attempt + 1,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (retryDelayMs > 0) {
      await sleep(retryDelayMs);
    }
  }

  throw new Error('Gemini request failed after retry.');
}
