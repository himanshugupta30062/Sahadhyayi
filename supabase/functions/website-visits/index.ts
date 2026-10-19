
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/json',
}

interface VisitData {
  event_id?: string;
  event_type?: string;
  event_name?: string | null;
  engaged_seconds?: number;
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

  if (userAgent.includes('Edg')) {
    browser = 'Edge';
    browserVersion = userAgent.match(/Edg\/([0-9.]+)/)?.[1] ?? '';
  } else if (userAgent.includes('OPR') || userAgent.includes('Opera')) {
    browser = 'Opera';
    browserVersion = userAgent.match(/(OPR|Opera)\/([0-9.]+)/)?.[2] ?? '';
  } else if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] ?? '';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] ?? '';
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
    browserVersion = userAgent.match(/Version\/([0-9.]+)/)?.[1] ?? '';
  }

  if (userAgent.includes('iPhone')) {
    os = 'iOS'; deviceType = 'Mobile'; deviceModel = 'iPhone';
  } else if (userAgent.includes('iPad')) {
    os = 'iPadOS'; deviceType = 'Tablet'; deviceModel = 'iPad';
  } else if (userAgent.includes('Android')) {
    os = 'Android'; deviceType = /Mobile/i.test(userAgent) ? 'Mobile' : 'Tablet';
    deviceModel = userAgent.match(/;\s*([^;)]+)\s*Build\//)?.[1]?.trim() ?? '';
  } else if (userAgent.includes('Windows NT 10.0')) {
    os = 'Windows 10/11';
  } else if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    const version = userAgent.match(/Mac OS X ([0-9_]+)/)?.[1];
    os = version ? 'macOS ' + version.replace(/_/g, '.') : 'macOS';
    if (userAgent.includes('Macintosh')) deviceModel = 'Mac';
  } else if (userAgent.includes('CrOS')) {
    os = 'Chrome OS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }
  if (userAgent.includes('Mobile') && !userAgent.includes('iPad')) deviceType = 'Mobile';
  return { browser, browserVersion, os, deviceType, deviceModel };
}

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function parseCountryCode(req: Request): string | null {
  const cloudflareCountry = req.headers.get('cf-ipcountry');
  if (cloudflareCountry && /^[A-Z]{2}$/.test(cloudflareCountry)) return cloudflareCountry;
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Analytics ingest is missing Supabase environment configuration');
      return new Response(JSON.stringify({ error: 'Analytics ingestion unavailable' }), { status: 503, headers: corsHeaders });
    }

    const body = await req.json().catch(() => null) as VisitData | null;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return new Response(JSON.stringify({ error: 'Expected a JSON event body' }), { status: 400, headers: corsHeaders });
    }

    const eventType = clean(body.event_type, 40) || 'pageview';
    if (!['pageview', 'page_view', 'activity', 'event', 'engagement'].includes(eventType)) {
      return new Response(JSON.stringify({ error: 'Unsupported event_type' }), { status: 400, headers: corsHeaders });
    }
    const page = (clean(body.page, 300)?.split(/[?#]/, 1)[0] || '/').slice(0, 300);
    const referrer = clean(body.referrer, 300);
    const userAgent = clean(body.userAgent || req.headers.get('user-agent') || '', 500) || '';
    const ua = parseUserAgent(userAgent);
    const visitorId = clean(body.visitor_id, 100);
    const sessionId = clean(body.session_id, 100);
    const eventName = clean(body.event_name, 100);
    const countryCode = parseCountryCode(req);
    const screenResolution = clean(body.screenResolution, 32);
    const language = clean(body.language, 32);
    const timezone = clean(body.timezone, 64);
    const eventId = clean(body.event_id, 100);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Authenticate an attached user only from a server-verified JWT; a body user_id is never trusted.
    let authUserId: string | null = null;
    const authorization = req.headers.get('authorization');
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice(7).trim();
      if (token) {
        try {
          const { data } = await supabase.auth.getUser(token);
          authUserId = data.user?.id ?? null;
        } catch {
          authUserId = null;
        }
      }
    }


    // Engagement heartbeats are written to a separate, short-retention table and
    // deliberately do not increment page-view/lifetime counters.
    if (eventType === 'engagement') {
      const engagedSeconds = typeof body.engaged_seconds === 'number' && Number.isFinite(body.engaged_seconds)
        ? Math.max(0, Math.min(15, Math.floor(body.engaged_seconds)))
        : 0;
      if (!sessionUuid || !visitorUuid || engagedSeconds < 1) {
        return new Response(JSON.stringify({ success: true, ignored: true, reason: 'invalid_engagement_sample' }), { status: 200, headers: corsHeaders });
      }
      const { error: engagementError } = await supabase.from('website_engagement_events').insert({
        event_id: eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId) ? eventId : crypto.randomUUID(),
        session_id: sessionUuid,
        visitor_id: visitorUuid,
        page_path: page,
        engaged_seconds: engagedSeconds,
        created_at: new Date().toISOString(),
      });
      if (engagementError) {
        console.error('Failed to record engagement heartbeat', { code: engagementError.code, message: engagementError.message });
        return new Response(JSON.stringify({ error: 'Failed to record engagement' }), { status: 500, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ success: true, recordedIn: 'website_engagement_events' }), { status: 200, headers: corsHeaders });
    }

    // Stable id is used for a single ingestion operation. Client-generated event IDs are accepted only as UUIDs.
    const validEventId = eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)
      ? eventId : crypto.randomUUID();

    // Primary write: recent analytics table.
    const { error: rollingError } = await supabase.from('website_visit_events').insert({
      id: validEventId,
      session_id: sessionId,
      visitor_id: visitorId,
      page_path: page,
      referrer,
      event_type: ['activity', 'event'].includes(eventType) ? 'activity' : 'pageview',
      created_at: new Date().toISOString(),
      event_name: eventName,
      device_type: ua.deviceType,
      country_code: countryCode,
    });

    if (rollingError) {
      console.error('Failed to write website_visit_events', {
        code: rollingError.code,
        message: rollingError.message,
        details: rollingError.details,
      });
      return new Response(JSON.stringify({ error: 'Failed to record analytics event', stage: 'rolling_write' }), { status: 500, headers: corsHeaders });
    }

    // Lifetime/visitor detail mirror: preserve compatibility with existing admin tools.
    const { error: legacyError } = await supabase.from('website_visits').insert({
      event_id: validEventId,
      event_type: ['activity', 'event'].includes(eventType) ? 'activity' : 'pageview',
      event_name: eventName,
      session_id: sessionId,
      visitor_id: visitorId,
      user_id: authUserId,
      utm_source: clean(body.utm_source, 100),
      utm_medium: clean(body.utm_medium, 100),
      utm_campaign: clean(body.utm_campaign, 100),
      user_agent: userAgent.slice(0, 500) || 'Unknown',
      page_url: page,
      country_code: countryCode,
      browser: ua.browser,
      browser_version: ua.browserVersion || null,
      os: ua.os,
      device_type: ua.deviceType,
      device_model: ua.deviceModel || null,
      referrer,
      screen_resolution: screenResolution,
      language,
      timezone,
      metadata: {},
    });

    if (legacyError) {
      // Recent analytics has already been safely recorded. Surface this as a partial failure for logs.
      console.error('Rolling analytics was recorded but legacy mirror failed', {
        code: legacyError.code,
        message: legacyError.message,
        details: legacyError.details,
      });
      return new Response(JSON.stringify({ success: true, partial: true, recordedIn: 'website_visit_events' }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, eventId: validEventId, recordedIn: ['website_visit_events', 'website_visits'] }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('website-visits ingestion error', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
