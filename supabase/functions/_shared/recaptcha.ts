export type RecaptchaAction = 'signin' | 'signup' | 'password_reset' | 'confirm_email_resend' | 'contact' | 'create_post' | 'comment' | 'upload_pdf' | string;

export interface RecaptchaVerification {
  valid: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  error?: string;
}

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const ALLOWED_HOSTNAMES = new Set(['sahadhyayi.com', 'www.sahadhyayi.com', 'localhost']);

/**
 * Verifies a reCAPTCHA token server-side.
 * Supports both Google reCAPTCHA Enterprise Assessment API (using RECAPTCHA_ENTERPRISE_PROJECT_ID
 * and RECAPTCHA_ENTERPRISE_API_KEY or GCP_PROJECT_ID) and standard reCAPTCHA v3 siteverify
 * (using RECAPTCHA_SECRET_KEY). Keep secrets in Supabase Edge Function secrets; never bundle into frontend code.
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction: RecaptchaAction,
  options: { minScore?: number; allowedHostnames?: Set<string>; siteKey?: string } = {},
): Promise<RecaptchaVerification> {
  if (!token || token.length > 8192) return { valid: false, error: 'missing_or_invalid_token' };

  const enterpriseProjectId = Deno.env.get('RECAPTCHA_ENTERPRISE_PROJECT_ID') || Deno.env.get('GCP_PROJECT_ID');
  const enterpriseApiKey = Deno.env.get('RECAPTCHA_ENTERPRISE_API_KEY') || Deno.env.get('RECAPTCHA_API_KEY');
  const enterpriseSiteKey = options.siteKey || Deno.env.get('RECAPTCHA_SITE_KEY');

  // If Enterprise Assessment API credentials are provided, use Google Cloud Enterprise Assessment
  if (enterpriseProjectId && enterpriseApiKey) {
    try {
      const assessmentUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(enterpriseProjectId)}/assessments?key=${encodeURIComponent(enterpriseApiKey)}`;
      const response = await fetch(assessmentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            token,
            siteKey: enterpriseSiteKey,
            expectedAction,
          },
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        console.error('[recaptcha-enterprise] Assessment request failed with status:', response.status);
        return { valid: false, error: 'enterprise_verification_unavailable' };
      }

      const assessment = await response.json() as {
        tokenProperties?: {
          valid?: boolean;
          invalidReason?: string;
          hostname?: string;
          action?: string;
        };
        riskAnalysis?: {
          score?: number;
          reasons?: string[];
        };
      };

      const tokenProps = assessment.tokenProperties;
      if (!tokenProps?.valid) {
        return { valid: false, error: tokenProps?.invalidReason || 'enterprise_token_invalid' };
      }

      const hostnames = options.allowedHostnames ?? ALLOWED_HOSTNAMES;
      if (tokenProps.hostname && !hostnames.has(tokenProps.hostname.toLowerCase())) {
        return { valid: false, score: assessment.riskAnalysis?.score, action: tokenProps.action, hostname: tokenProps.hostname, error: 'hostname_mismatch' };
      }

      if (tokenProps.action && tokenProps.action.toLowerCase() !== expectedAction.toLowerCase()) {
        return { valid: false, score: assessment.riskAnalysis?.score, action: tokenProps.action, hostname: tokenProps.hostname, error: 'action_mismatch' };
      }

      const score = typeof assessment.riskAnalysis?.score === 'number' ? assessment.riskAnalysis.score : 0;
      const minScore = options.minScore ?? 0.5;
      return {
        valid: score >= minScore,
        score,
        action: tokenProps.action,
        hostname: tokenProps.hostname,
        error: score < minScore ? 'score_too_low' : undefined,
      };
    } catch (err) {
      console.error('[recaptcha-enterprise] Assessment execution failed:', err);
      return { valid: false, error: 'enterprise_assessment_failed' };
    }
  }

  // Fallback to standard reCAPTCHA v3 siteverify
  const secret = Deno.env.get('RECAPTCHA_SECRET_KEY');
  if (!secret) {
    console.error('[recaptcha] Neither RECAPTCHA_SECRET_KEY nor RECAPTCHA_ENTERPRISE credentials are configured');
    return { valid: false, error: 'verification_not_configured' };
  }

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
    if (result.action && result.action.toLowerCase() !== expectedAction.toLowerCase()) {
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
