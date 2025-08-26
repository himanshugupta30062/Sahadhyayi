import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { book_id, event_type } = await req.json();
    if (!book_id || !event_type) {
      return new Response(JSON.stringify({ error: 'Missing book_id or event_type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insertError } = await supabase
      .from('book_events')
      .insert({ book_id, event_type, user_id: user.id });
    if (insertError) throw insertError;

    const since = new Date();
    since.setDate(since.getDate() - 14);
    const sinceISO = since.toISOString();

    const { count: viewsCount, error: viewsError } = await supabase
      .from('book_events')
      .select('*', { count: 'exact', head: true })
      .eq('book_id', book_id)
      .eq('event_type', 'view')
      .gte('created_at', sinceISO);

    const { count: downloadsCount, error: downloadsError } = await supabase
      .from('book_events')
      .select('*', { count: 'exact', head: true })
      .eq('book_id', book_id)
      .eq('event_type', 'download')
      .gte('created_at', sinceISO);

    if (viewsError) throw viewsError;
    if (downloadsError) throw downloadsError;

    return new Response(
      JSON.stringify({ views: viewsCount || 0, downloads: downloadsCount || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
