
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface VisitData {
  event_id?: string;
  event_type?: string;
  event_name?: string | null;
  visitor_id?: string;
  session_id?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  userAgent?: string;
  page?: string;
  referrer?: string;
  screenResolution?: string;
  language?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
}

interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: string;
  deviceModel: string;
}

function parseUserAgent(userAgent: string): ParsedUserAgent {
  let browser = 'Unknown';
  let browserVersion = '';
  let os = 'Unknown';
  let deviceType = 'Desktop';
  let deviceModel = '';

  // Browser detection
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg') && !userAgent.includes('OPR')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('OPR') || userAgent.includes('Opera')) {
    browser = 'Opera';
    const match = userAgent.match(/(OPR|Opera)\/([0-9.]+)/);
    browserVersion = match ? match[2] : '';
  }

  // OS detection
  if (userAgent.includes('Windows NT 10.0')) {
    os = 'Windows 10/11';
  } else if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X ([0-9_]+)/);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android ([0-9.]+)/);
    os = match ? `Android ${match[1]}` : 'Android';
    deviceType = 'Mobile';
  } else if (userAgent.includes('iPhone')) {
    os = 'iOS';
    deviceType = 'Mobile';
  } else if (userAgent.includes('iPad')) {
    os = 'iPadOS';
    deviceType = 'Tablet';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('CrOS')) {
    os = 'Chrome OS';
  }

  // Device type refinement
  if (userAgent.includes('Mobile') && !userAgent.includes('iPad')) {
    deviceType = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceType = 'Tablet';
  }

  // Device model extraction
  const androidModel = userAgent.match(/;\s*([^;)]+)\s*Build\//);
  if (androidModel) {
    deviceModel = androidModel[1].trim();
  } else if (userAgent.includes('iPhone')) {
    deviceModel = 'iPhone';
  } else if (userAgent.includes('iPad')) {
    deviceModel = 'iPad';
  } else if (userAgent.includes('Macintosh')) {
    deviceModel = 'Mac';
  }

  return { browser, browserVersion, os, deviceType, deviceModel };
}

interface GeoData {
  country_code: string | null;
  city: string | null;
  region: string | null;
}

async function getGeoFromIP(ip: string): Promise<GeoData> {
  const empty: GeoData = { country_code: null, city: null, region: null };
  try {
    if (!ip || ip === '0.0.0.0') return empty;
    const isPrivateV4 = ip.startsWith('192.168.') || ip.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
    if (ip === '127.0.0.1' || ip === '::1' || isPrivateV4) {
      return { country_code: 'LOCAL', city: null, region: null };
    }

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'Sahadhyayi-Analytics/1.0' },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        country_code: data.country_code || null,
        city: data.city || null,
        region: data.region || null,
      };
    }
    return empty;
  } catch {
    return empty;
  }
}

function getRealIP(request: Request): string {
  const h = request.headers;
  return (
    h.get('CF-Connecting-IP') ||
    h.get('X-Forwarded-For')?.split(',')[0].trim() ||
    h.get('X-Real-IP') ||
    h.get('X-Client-IP') ||
    '0.0.0.0'
  );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_NAME_RE = /^[a-z][a-z0-9_.-]{0,79}$/i;
const ANALYTICS_METADATA_KEYS = new Set([
  'target_type', 'target_label', 'target_id', 'target_href', 'component', 'section',
  'action', 'cta', 'filter', 'completed', 'step', 'item_type', 'item_id',
  'book_id', 'group_id', 'post_id', 'form_id', 'form_name', 'input_type',
  'field_name', 'control_type', 'query_length', 'result_count', 'duration_ms',
  'scroll_depth_percent', 'tab', 'method', 'status', 'source', 'category',
  'is_authenticated', 'success', 'opened',
]);

function validUuid(value: unknown): string | null {
  return typeof value === 'string' && UUID_RE.test(value) ? value : null;
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function normalizePath(value: unknown): string {
  if (typeof value !== 'string') return '/';
  const raw = value.trim().slice(0, 1000);
  if (!raw || raw.startsWith('//')) return '/';
  try {
    const parsed = new URL(raw, 'https://www.sahadhyayi.com');
    if (parsed.origin !== 'https://www.sahadhyayi.com') return '/';
    return cleanText(parsed.pathname, 200) || '/';
  } catch {
    return '/';
  }
}

function normalizeReferrer(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const hostname = new URL(value.startsWith('http') ? value : `https://${value}`).hostname.toLowerCase();
    return hostname.slice(0, 200) || null;
  } catch {
    return null;
  }
}

function sanitizeMetadata(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const result: Record<string, string | number | boolean> = {};
  for (const [rawKey, rawValue] of Object.entries(source)) {
    const key = rawKey.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 40);
    if (!ANALYTICS_METADATA_KEYS.has(key)) continue;
    if (typeof rawValue === 'string') {
      const normalized = cleanText(rawValue, key === 'target_label' ? 80 : 120);
      if (normalized) result[key] = normalized;
    } else if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      result[key] = Math.max(0, Math.min(rawValue, key === 'duration_ms' ? 1800000 : 1000000000));
    } else if (typeof rawValue === 'boolean') {
      result[key] = rawValue;
    }
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  // Do not let CI/Netlify/Cloudflare preview builds pollute production analytics.
  const origin = req.headers.get('origin');
  if (origin) {
    let normalizedOrigin = '';
    try { normalizedOrigin = new URL(origin).origin; } catch { normalizedOrigin = ''; }
    if (!['https://sahadhyayi.com', 'https://www.sahadhyayi.com'].includes(normalizedOrigin)) {
      return new Response(JSON.stringify({ error: 'Analytics accepts events only from the production site' }), { status: 403, headers: jsonHeaders });
    }
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  }

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > 12000) {
    return new Response(JSON.stringify({ error: 'Event payload too large' }), { status: 413, headers: jsonHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Analytics service unavailable' }), { status: 503, headers: jsonHeaders });
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: jsonHeaders });
    }
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return new Response(JSON.stringify({ error: 'Invalid event payload' }), { status: 400, headers: jsonHeaders });
    }

    const body = rawBody as VisitData;
    const eventType = body.event_type || 'pageview';
    if (eventType !== 'pageview' && eventType !== 'activity') {
      return new Response(JSON.stringify({ error: 'Unsupported event type' }), { status: 400, headers: jsonHeaders });
    }

    const eventName = eventType === 'activity'
      ? cleanText(body.event_name, 80)?.toLowerCase() || null
      : null;
    if (eventType === 'activity' && (!eventName || !EVENT_NAME_RE.test(eventName))) {
      return new Response(JSON.stringify({ error: 'Invalid activity event name' }), { status: 400, headers: jsonHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Always derive user_id from a verified Auth token; never trust a body-provided user id.
    let authUserId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token) {
          const { data: userData } = await supabase.auth.getUser(token);
          authUserId = userData?.user?.id || null;
        }
      } catch {
        // Expired/invalid token: safely record as anonymous.
      }
    }

    const isPageView = eventType === 'pageview';
    const userAgent = isPageView
      ? cleanText(body.userAgent || req.headers.get('user-agent'), 500) || 'Unknown'
      : null;
    const ua = userAgent ? parseUserAgent(userAgent) : null;

    // Geo/IP data is only retained once per pageview, never for individual UI actions.
    let ipAddress: string | null = null;
    let geo: GeoData = { country_code: null, city: null, region: null };
    if (isPageView) {
      const candidate = getRealIP(req);
      if (candidate && candidate !== '0.0.0.0' && candidate !== '127.0.0.1') {
        ipAddress = candidate.slice(0, 100);
      }
      geo = await getGeoFromIP(candidate);
    }

    const eventId = validUuid(body.event_id) || crypto.randomUUID();
    const visitorId = validUuid(body.visitor_id);
    const sessionId = validUuid(body.session_id);
    const page = normalizePath(body.page);
    const referrer = normalizeReferrer(body.referrer);

    const campaign = (value: unknown) => cleanText(value, 100)?.replace(/[^a-zA-Z0-9 _.-]/g, '') || null;
    const metadata = eventType === 'activity' ? sanitizeMetadata(body.metadata) : {};

    const record = {
      event_id: eventId,
      event_type: eventType,
      event_name: eventName,
      visitor_id: visitorId,
      session_id: sessionId,
      user_id: authUserId,
      utm_source: campaign(body.utm_source),
      utm_medium: campaign(body.utm_medium),
      utm_campaign: campaign(body.utm_campaign),
      ip_address: ipAddress,
      user_agent: userAgent && ua
        ? `${ua.browser} ${ua.browserVersion} on ${ua.os} (${ua.deviceType})`
        : userAgent,
      page_url: page,
      country_code: geo.country_code,
      city: geo.city,
      region: geo.region,
      browser: ua?.browser || null,
      browser_version: ua?.browserVersion || null,
      os: ua?.os || null,
      device_type: ua?.deviceType || null,
      device_model: ua?.deviceModel || null,
      referrer,
      screen_resolution: isPageView ? cleanText(body.screenResolution, 40) : null,
      language: isPageView ? cleanText(body.language, 40) : null,
      timezone: isPageView ? cleanText(body.timezone, 80) : null,
      metadata,
    };

    const { error } = await supabase
      .from('website_visits')
      .upsert(record, { onConflict: 'event_id', ignoreDuplicates: true });

    if (error) {
      // Avoid logging raw payloads, tokens or IPs.
      console.error('Failed to record analytics event:', error.code || 'database_error', error.message);
      return new Response(JSON.stringify({ error: 'Failed to record analytics event' }), { status: 500, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ success: true, event_type: eventType }), { status: 202, headers: jsonHeaders });
  } catch (error) {
    console.error('Analytics function error:', error instanceof Error ? error.message : 'unknown_error');
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: jsonHeaders });
  }
});
