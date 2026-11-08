import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { enforceRateLimit, getClientIp } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_TYPES = new Set(['view', 'download']);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !serviceRoleKey || !anonKey) return json({ error: 'Event service unavailable' }, 503);

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  let userId: string | null = null;
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    if (!authHeader.toLowerCase().startsWith('bearer ')) return json({ error: 'Invalid authorization header' }, 401);
    const token = authHeader.slice(7).trim();
    if (!token) return json({ error: 'Invalid authorization header' }, 401);
    const caller = createClient(supabaseUrl, anonKey, { auth: { persistSession: false }, global: { headers: { Authorization: authHeader } } });
    const { data, error } = await caller.auth.getUser(token);
    if (error || !data.user) return json({ error: 'Invalid or expired session' }, 401);
    userId = data.user.id;
  }

  const rateLimitResponse = await enforceRateLimit(req, {
    endpoint: 'log-book-event',
    maxRequests: userId ? 120 : 60,
    windowMinutes: 10,
    identifier: userId ? `user:${userId}` : `ip:${getClientIp(req)}`,
    supabaseClient: supabase,
  });
  if (rateLimitResponse) return rateLimitResponse;

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'Invalid request body' }, 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: 'Request body must be valid JSON' }, 400);
  }
  const bookId = body.book_id;
  const eventType = body.event_type;
  if (typeof bookId !== 'string' || !UUID.test(bookId)) return json({ error: 'A valid book_id is required' }, 400);
  if (typeof eventType !== 'string' || !EVENT_TYPES.has(eventType)) return json({ error: 'Unsupported event_type' }, 400);

  try {
    const { error: insertError } = await supabase.from('book_events').insert({ book_id: bookId, event_type: eventType, user_id: userId });
    if (insertError) throw insertError;

    const since = new Date();
    since.setDate(since.getDate() - 14);
    const [{ count: viewCount, error: viewError }, { count: downloadCount, error: downloadError }] = await Promise.all([
      supabase.from('book_events').select('*', { count: 'exact', head: true }).eq('book_id', bookId).eq('event_type', 'view').gte('created_at', since.toISOString()),
      supabase.from('book_events').select('*', { count: 'exact', head: true }).eq('book_id', bookId).eq('event_type', 'download').gte('created_at', since.toISOString()),
    ]);
    if (viewError || downloadError) throw viewError || downloadError;
    return json({ views: viewCount || 0, downloads: downloadCount || 0 });
  } catch (err) {
    console.error('Error logging book event:', err);
    return json({ error: 'Server error' }, 500);
  }
});
