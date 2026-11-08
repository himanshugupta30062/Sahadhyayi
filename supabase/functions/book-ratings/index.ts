import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { enforceRateLimit, getClientIp } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (!['GET', 'POST'].includes(req.method)) return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: 'Ratings service unavailable' }, 503);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    if (req.method === 'GET') {
      const bookId = new URL(req.url).searchParams.get('book_id');
      if (!bookId || !UUID.test(bookId)) return json({ error: 'A valid book_id is required' }, 400);

      const limited = await enforceRateLimit(req, {
        endpoint: 'book-ratings-read', identifier: getClientIp(req),
        maxRequests: 60, windowMinutes: 10, supabaseClient: admin,
      });
      if (limited) return limited;

      const { data, error } = await admin.from('book_ratings').select('rating').eq('book_id', bookId);
      if (error) throw error;
      const ratings = data ?? [];
      const avg = ratings.length ? ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length : 0;
      return json({ avgRating: Number(avg.toFixed(2)), count: ratings.length });
    }

    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid request body' }, 400);
    const { bookId, rating } = body as { bookId?: unknown; rating?: unknown };
    if (typeof bookId !== 'string' || !UUID.test(bookId)) return json({ error: 'A valid bookId is required' }, 400);
    if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
      return json({ error: 'rating must be an integer from 1 to 5' }, 400);
    }

    const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return json({ error: 'Unauthorized' }, 401);
    const caller = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await caller.auth.getUser(token);
    if (authError || !authData.user) return json({ error: 'Unauthorized' }, 401);

    const limited = await enforceRateLimit(req, {
      endpoint: 'book-ratings-write', identifier: authData.user.id,
      maxRequests: 10, windowMinutes: 10, supabaseClient: admin,
    });
    if (limited) return limited;

    const { error } = await admin.from('book_ratings')
      .upsert({ book_id: bookId, user_id: authData.user.id, rating }, { onConflict: 'book_id,user_id' });
    if (error) throw error;
    return json({ success: true });
  } catch (err) {
    console.error('Book ratings request failed:', err);
    return json({ error: 'Book ratings request failed' }, 500);
  }
});
