
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
    if (!ip || ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: VisitData = await req.json();
    const ipAddress = getRealIP(req);
    const geo = await getGeoFromIP(ipAddress);
    const ua = body.userAgent ? parseUserAgent(body.userAgent) : null;

    // Extract authenticated user ID exclusively from server-side JWT verification
    let authUserId: string | null = null;
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        try {
          const { data: userData } = await supabase.auth.getUser(token);
          if (userData?.user?.id) {
            authUserId = userData.user.id;
          }
        } catch {
          // Token invalid or expired — treat as anonymous visitor
        }
      }
    }

    // Build a readable user_agent summary for legacy column
    const userAgentDisplay = ua
      ? `${ua.browser} ${ua.browserVersion} on ${ua.os} (${ua.deviceType})`
      : body.userAgent || 'Unknown';

    // 1. Dual-Table Architecture: Ingest into new rolling 30-day website_visit_events
    // Strictly privacy-conscious: NO raw IP address, email, or browser fingerprint!
    try {
      await supabase.from('website_visit_events').insert({
        session_id: body.session_id ? String(body.session_id).slice(0, 100) : null,
        visitor_id: body.visitor_id ? String(body.visitor_id).slice(0, 100) : null,
        page_path: String(body.page || '/').slice(0, 300),
        referrer: body.referrer ? String(body.referrer).slice(0, 300) : null,
        event_type: body.event_type || 'page_view',
        event_name: body.event_name ? String(body.event_name).slice(0, 100) : null,
        device_type: ua?.deviceType || 'Desktop',
        country_code: geo.country_code ? String(geo.country_code).slice(0, 10) : null,
      });
    } catch (eventErr) {
      console.warn('Non-fatal: could not write to website_visit_events:', eventErr);
    }

    // 2. Dual-Table Architecture: Preserve original website_visits table for lifetime analytics
    const { error } = await supabase.from('website_visits').insert({
      event_id: body.event_id || undefined,
      event_type: body.event_type || 'pageview',
      event_name: body.event_name || null,
      session_id: body.session_id || null,
      visitor_id: body.visitor_id || null,
      user_id: authUserId,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      ip_address: ipAddress === '0.0.0.0' ? null : ipAddress,
      user_agent: userAgentDisplay,
      page_url: body.page || null,
      country_code: geo.country_code,
      city: geo.city,
      region: geo.region,
      browser: ua?.browser || null,
      browser_version: ua?.browserVersion || null,
      os: ua?.os || null,
      device_type: ua?.deviceType || 'Desktop',
      device_model: ua?.deviceModel || null,
      referrer: body.referrer || null,
      screen_resolution: body.screenResolution || null,
      language: body.language || null,
    });

    if (error) {
      console.error('Error recording legacy visit:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to record visit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
