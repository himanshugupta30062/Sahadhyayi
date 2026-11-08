import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { enforceRateLimit, getClientIp } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Visit tracking unavailable' }), {
      status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const ip = getClientIp(req);
    const limited = await enforceRateLimit(req, {
      endpoint: 'website-clicks',
      identifier: ip,
      maxRequests: 30,
      windowMinutes: 10,
      supabaseClient: supabase,
    });
    if (limited) return limited;

    let body: { page_url?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const pageUrl = typeof body.page_url === 'string' ? body.page_url.trim() : '';
    if (!pageUrl || pageUrl.length > 2048) {
      return new Response(JSON.stringify({ error: 'page_url must be a non-empty string under 2048 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let parsedUrl: URL;
    try { parsedUrl = new URL(pageUrl); } catch {
      return new Response(JSON.stringify({ error: 'page_url must be a valid URL' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
      return new Response(JSON.stringify({ error: 'Unsupported page_url protocol' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const country =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-nf-country');

    const { error: insertError } = await supabase.from('website_visits').insert({
      ip_address: ip === 'unknown-ip' ? null : ip,
      user_agent: (req.headers.get('user-agent') || '').slice(0, 512),
      page_url: pageUrl,
      country: country?.slice(0, 8),
    });
    if (insertError) throw insertError;

    const { count, error: countError } = await supabase
      .from('website_visits')
      .select('*', { count: 'exact', head: true });
    if (countError) throw countError;

    return new Response(JSON.stringify({ totalVisits: count }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Error recording website visit:', error);
    return new Response(JSON.stringify({ error: 'Failed to record visit' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
