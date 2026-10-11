import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cleanLabel = (value: unknown) => typeof value === 'string'
  ? value.replace(/[^a-zA-Z0-9 _.-]/g, '').trim().slice(0, 100) || null
  : null;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

function cleanPath(value: unknown): string {
  if (typeof value !== 'string' || value.length > 500) return '/';
  try {
    const url = new URL(value, 'https://sahadhyayi.invalid');
    return url.pathname.slice(0, 200) || '/';
  } catch {
    return '/';
  }
}

function cleanReferrer(value: unknown): string | null {
  if (typeof value !== 'string' || !value || value.length > 500) return null;
  try { return new URL(value).hostname.toLowerCase().slice(0, 200) || null; } catch { return null; }
}

function deviceFromUserAgent(value: string) {
  if (/iPad|Tablet/i.test(value)) return 'Tablet';
  if (/Mobile|Android|iPhone/i.test(value)) return 'Mobile';
  return 'Desktop';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'Analytics is unavailable' }, 503);

  try {
    const raw = await req.text();
    if (raw.length > 8_192) return json({ error: 'Event is too large' }, 413);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const eventId = typeof body.event_id === 'string' && UUID.test(body.event_id) ? body.event_id : null;
    const sessionId = typeof body.session_id === 'string' && UUID.test(body.session_id) ? body.session_id : null;
    const visitorId = typeof body.visitor_id === 'string' && UUID.test(body.visitor_id) ? body.visitor_id : null;
    const eventType = body.event_type === 'activity' ? 'activity' : 'pageview';
    const eventName = eventType === 'activity' ? cleanLabel(body.event_name) : null;
    if (!eventId || !sessionId || !visitorId || (eventType === 'activity' && !eventName)) {
      return json({ error: 'Invalid analytics event' }, 400);
    }

    const client = createClient(url, key, { auth: { persistSession: false } });
    let userId: string | null = null;
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (token) {
      const { data } = await client.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const userAgent = req.headers.get('user-agent') ?? '';
    const { error } = await client.from('website_visits').upsert({
      event_id: eventId,
      event_type: eventType,
      event_name: eventName,
      session_id: sessionId,
      visitor_id: visitorId,
      user_id: userId,
      page_url: cleanPath(body.page),
      referrer: cleanReferrer(body.referrer),
      utm_source: cleanLabel(body.utm_source),
      utm_medium: cleanLabel(body.utm_medium),
      utm_campaign: cleanLabel(body.utm_campaign),
      device_type: deviceFromUserAgent(userAgent),
    }, { onConflict: 'event_id', ignoreDuplicates: true });
    if (error) throw error;

    return json({ recorded: true });
  } catch (error) {
    console.error('Analytics event rejected:', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'Failed to record event' }, 400);
  }
});
