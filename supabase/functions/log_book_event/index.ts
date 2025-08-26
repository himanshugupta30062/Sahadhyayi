import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } }
  });

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { book_id, event_type } = await req.json();
    if (!book_id || !event_type) {
      return new Response(
        JSON.stringify({ error: 'book_id and event_type required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: insertError } = await supabase
      .from('book_events')
      .insert({ book_id, event_type, user_id: user.id });
    if (insertError) throw insertError;

    const since = new Date();
    since.setDate(since.getDate() - 14);

    const { count: viewCount, error: viewError } = await supabase
      .from('book_events')
      .select('*', { count: 'exact', head: true })
      .eq('book_id', book_id)
      .eq('event_type', 'view')
      .gte('created_at', since.toISOString());
    if (viewError) throw viewError;

    const { count: downloadCount, error: downloadError } = await supabase
      .from('book_events')
      .select('*', { count: 'exact', head: true })
      .eq('book_id', book_id)
      .eq('event_type', 'download')
      .gte('created_at', since.toISOString());
    if (downloadError) throw downloadError;

    return new Response(
      JSON.stringify({
        views: viewCount || 0,
        downloads: downloadCount || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error logging book event:', err);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

