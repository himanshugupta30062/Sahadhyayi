/**
 * Client-side helpers for checking a candidate password against the
 * "Pwned Passwords" breach corpus without ever sending the password itself
 * (or even its full hash) anywhere.
 *
 * How it works (k-anonymity, https://www.troyhunt.com/ive-been-pwned-so-have-my-passwords-but-you-dont-have-to-give-me-your-password-to-find-out/):
 *  1. Hash the password with SHA-1 in the browser using WebCrypto.
 *  2. Send only the first 5 hex characters of the hash to the leak-check
 *     backend (the `check-password-strength` Supabase Edge Function).
 *  3. The backend asks haveibeenpwned for every hash sharing that prefix and
 *     compares the remaining suffix server-side.
 */

async function sha1HexUpper(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export interface LeakCheckResult {
  /** true when the password appears in known breach corpora. */
  leaked: boolean;
  /** approximate number of times the password appeared in breaches (if leaked). */
  count: number | null;
}

/**
 * Returns true when the leak check could not be completed (network failure,
 * edge function not deployed yet, etc.). Callers treat this as "unknown".
 */
export class PasswordLeakCheckUnavailableError extends Error {
  constructor(message = 'Password leak check is currently unavailable.') {
    super(message);
    this.name = 'PasswordLeakCheckUnavailableError';
  }
}

export async function isPasswordLeaked(password: string): Promise<LeakCheckResult> {
  const hash = await sha1HexUpper(password);
  const sha1Prefix = hash.slice(0, 5);
  const sha1Suffix = hash.slice(5);

  const functionsBase =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_SUPABASE_URL ?? 'https://rknxtatvlzunatpyqxro.supabase.co';

  let response: Response;
  try {
    response = await fetch(`${functionsBase}/functions/v1/check-password-strength`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha1Prefix, sha1Suffix }),
    });
  } catch {
    throw new PasswordLeakCheckUnavailableError();
  }

  if (!response.ok) {
    throw new PasswordLeakCheckUnavailableError();
  }

  const data = (await response.json()) as Partial<LeakCheckResult> & { error?: string };
  if (typeof data.leaked !== 'boolean') {
    throw new PasswordLeakCheckUnavailableError(data.error ?? undefined);
  }

  return { leaked: data.leaked, count: data.count ?? null };
}
