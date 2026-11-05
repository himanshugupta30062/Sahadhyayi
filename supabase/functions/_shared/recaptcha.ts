export type RecaptchaAction = 'signin' | 'signup' | 'password_reset' | 'contact' | 'create_post' | 'comment' | 'upload_pdf' | string;

export interface RecaptchaVerification {
  valid: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  error?: string;
}

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const ALLOWED_HOSTNAMES = new Set(['sahadhyayi.com', 'www.sahadhyayi.com']);

/**
 * Verifies a reCAPTCHA v3 token server-side. Keep the secret in Supabase Edge
 * Function secrets (RECAPTCHA_SECRET_KEY); never bundle it into frontend code.
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction: RecaptchaAction,
  options: { minScore?: number; allowedHostnames?: Set<string> } = {},
): Promise<RecaptchaVerification> {
  const secret = Deno.env.get('RECAPTCHA_SECRET_KEY');
  if (!secret) {
    console.error('[recaptcha] RECAPTCHA_SECRET_KEY is not configured');
    return { valid: false, error: 'verification_not_configured' };
  }
  if (!token || token.length > 8192) return { valid: false, error: 'missing_or_invalid_token' };

  const form = new URLSearchParams({ secret, response: token });
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { valid: false, error: 'verification_service_unavailable' };

    const result = await response.json() as {
      success?: boolean;
      score?: number;
      action?: string;
      hostname?: string;
      'error-codes'?: string[];
    };
    if (!result.success) return { valid: false, error: result['error-codes']?.join(',') || 'token_rejected' };

    const hostnames = options.allowedHostnames ?? ALLOWED_HOSTNAMES;
    if (!result.hostname || !hostnames.has(result.hostname.toLowerCase())) {
      return { valid: false, score: result.score, action: result.action, hostname: result.hostname, error: 'hostname_mismatch' };
    }
    if (result.action !== expectedAction) {
      return { valid: false, score: result.score, action: result.action, hostname: result.hostname, error: 'action_mismatch' };
    }

    const score = typeof result.score === 'number' ? result.score : 0;
    const minScore = options.minScore ?? 0.5;
    return {
      valid: score >= minScore,
      score,
      action: result.action,
      hostname: result.hostname,
      error: score < minScore ? 'score_too_low' : undefined,
    };
  } catch (error) {
    console.error('[recaptcha] Verification request failed:', error);
    return { valid: false, error: 'verification_request_failed' };
  }
}
