import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    const userId = parts[parts.length - 1] || '';

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: shelf, error } = await supabase
      .from('user_bookshelf')
      .select(`
        book_id,
        rating,
        books_library:book_id (
          id,
          title,
          author,
          genre,
          cover_image_url,
          description
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const genreScores: Record<string, number> = {};
    const excludeIds: string[] = [];

    for (const item of shelf ?? []) {
      excludeIds.push(item.book_id);
      const genre = item.books_library?.genre;
      if (!genre) continue;
      const weight = item.rating ?? 3;
      genreScores[genre] = (genreScores[genre] || 0) + weight;
    }

    const topGenres = Object.entries(genreScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([g]) => g);

    let query = supabase
      .from('books_library')
      .select('*')
      .limit(5);

    if (excludeIds.length) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }
    if (topGenres.length) {
      query = query.in('genre', topGenres);
    }

    const { data: recs, error: recError } = await query;
    if (recError) throw recError;

    return new Response(
      JSON.stringify({ recommendations: recs || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Recommendation error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to generate recommendations' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
