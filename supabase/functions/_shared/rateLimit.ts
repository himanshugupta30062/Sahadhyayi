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
 * By default, fails open on RPC infrastructure errors to prevent transient database
 * glitches from blocking legitimate content delivery (such as PDF streaming).
 * Sensitive mutation endpoints may set options.failClosed = true to fail closed.
 */
export async function checkRateLimit(
  supabaseClient: any,
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number,
  options: { failClosed?: boolean } = {}
): Promise<RateLimitResult> {
  const failClosed = options.failClosed ?? false;

  if (!identifier || !endpoint) {
    console.error('[rate-limit] Missing identifier or endpoint; denying request');
    return { allowed: false, status: 503, message: 'Rate-limit service unavailable. Please retry shortly.' };
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
      if (failClosed) {
        return { allowed: false, status: 503, message: 'Rate-limit service unavailable. Please retry shortly.' };
      }
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
    if (failClosed) {
      return { allowed: false, status: 503, message: 'Rate-limit service unavailable. Please retry shortly.' };
    }
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
      return new Response(JSON.stringify({ success: false, error: 'Rate-limit service unavailable. Please retry shortly.', code: 'RATE_LIMIT_UNAVAILABLE' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '30' } });
    }
    supabase = createClient(url, serviceKey);
  }

  const identifier = options.identifier || getClientIp(req);
  const result = await checkRateLimit(supabase, identifier, endpoint, maxRequests, windowMinutes);

  if (!result.allowed) {
    const unavailable = result.status === 503;
    return new Response(
      JSON.stringify({
        success: false,
        error: customMessage || result.message || 'Rate limit exceeded. Please try again later.',
        code: unavailable ? 'RATE_LIMIT_UNAVAILABLE' : 'RATE_LIMIT_EXCEEDED',
      }),
      {
        status: result.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': unavailable ? '30' : String(windowMinutes * 60),
        },
      }
    );
  }

  return null;
}

