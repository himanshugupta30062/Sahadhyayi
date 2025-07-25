import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip');

    let body: { page_url?: string } = {};
    try {
      body = await req.json();
    } catch (_) {
      // no body provided
    }

    const country =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-nf-country');

    const { error: insertError } = await supabase.from('website_visits').insert({
      ip_address: ip,
      user_agent: req.headers.get('user-agent'),
      page_url: body.page_url,
      country
    });
    if (insertError) throw insertError;

    const { count, error: countError } = await supabase
      .from('website_visits')
      .select('*', { count: 'exact', head: true });
    if (countError) throw countError;

    return new Response(JSON.stringify({ totalVisits: count }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error recording website visit:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to record visit' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
