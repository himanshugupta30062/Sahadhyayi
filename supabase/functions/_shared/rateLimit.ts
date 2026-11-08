import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, jsonResponse } from './auth.ts';

export function getClientIp(req: Request): string {
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim();

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp?.trim()) return xRealIp.trim();

  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor?.trim()) {
    return xForwardedFor.split(',')[0].trim();
  }

  return 'unknown-ip';
}

export interface RateLimitResult {
  allowed: boolean;
  status: number;
  message?: string;
}

/**
 * Validates rate limit against public.check_rate_limit RPC.
 * Falls open with a warning on database RPC errors so that transient DB issues
 * do not take down critical reader workflows, while strictly blocking when
 * the rate limit is exceeded.
 */
export async function checkRateLimit(
  supabaseClient: any,
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<RateLimitResult> {
  if (!identifier || !endpoint) {
    return { allowed: true, status: 200 };
  }

  try {
    const { data: allowed, error } = await supabaseClient.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    });

    if (error || typeof allowed !== 'boolean') {
      console.warn(`[rate-limit] RPC error for endpoint ${endpoint}:`, error?.message || 'unknown error');
      return { allowed: true, status: 200 };
    }

    if (!allowed) {
      return {
        allowed: false,
        status: 429,
        message: `Too many requests for ${endpoint}. Please try again later.`,
      };
    }

    return { allowed: true, status: 200 };
  } catch (err) {
    console.warn(`[rate-limit] Exception checking rate limit for ${endpoint}:`, err);
    return { allowed: true, status: 200 };
  }
}

/**
 * Enforces rate limiting on a request. Returns an error Response if rate limit is exceeded,
 * or null if request is permitted.
 */
export async function enforceRateLimit(
  req: Request,
  options: {
    endpoint: string;
    maxRequests: number;
    windowMinutes: number;
    identifier?: string;
    supabaseClient?: any;
    customMessage?: string;
  }
): Promise<Response | null> {
  const { endpoint, maxRequests, windowMinutes, customMessage } = options;
  let supabase = options.supabaseClient;

  if (!supabase) {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !serviceKey) {
      console.error('[rate-limit] Missing Supabase environment configuration');
      return null;
    }
    supabase = createClient(url, serviceKey);
  }

  const identifier = options.identifier || getClientIp(req);
  const result = await checkRateLimit(supabase, identifier, endpoint, maxRequests, windowMinutes);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: customMessage || result.message || 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(windowMinutes * 60),
        },
      }
    );
  }

  return null;
}

