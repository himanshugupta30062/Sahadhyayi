export interface HCaptchaVerification {
  valid: boolean;
  hostname?: string;
  credit?: boolean;
  error?: string;
}

const HCAPTCHA_VERIFY_URL = 'https://api.hcaptcha.com/siteverify';

/**
 * Verifies an hCaptcha token server-side against hCaptcha's siteverify endpoint.
 * Requires HCAPTCHA_SECRET or HCAPTCHA_SECRET_KEY in Edge Function secrets.
 */
export async function verifyHCaptcha(
  token: string,
  options: { remoteIp?: string; siteKey?: string } = {},
): Promise<HCaptchaVerification> {
  if (!token || token.length > 8192) return { valid: false, error: 'missing_or_invalid_token' };

  const secret = Deno.env.get('HCAPTCHA_SECRET') || Deno.env.get('HCAPTCHA_SECRET_KEY');
  const sitekey = options.siteKey || Deno.env.get('HCAPTCHA_SITE_KEY') || Deno.env.get('VITE_HCAPTCHA_SITE_KEY');

  if (!secret) {
    console.error('[hcaptcha] Neither HCAPTCHA_SECRET nor HCAPTCHA_SECRET_KEY is configured');
    return { valid: false, error: 'verification_not_configured' };
  }

  const payload: Record<string, string> = {
    secret,
    response: token,
  };
  if (sitekey) payload.sitekey = sitekey;
  if (options.remoteIp) payload.remoteip = options.remoteIp;

  try {
    const response = await fetch(HCAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return { valid: false, error: 'verification_service_unavailable' };

    const result = await response.json() as {
      success?: boolean;
      hostname?: string;
      credit?: boolean;
      'error-codes'?: string[];
    };

    if (!result.success) {
      return { valid: false, error: result['error-codes']?.join(',') || 'token_rejected' };
    }

    return {
      valid: true,
      hostname: result.hostname,
      credit: result.credit,
    };
  } catch (error) {
    console.error('[hcaptcha] Verification request failed:', error);
    return { valid: false, error: 'verification_request_failed' };
  }
}

