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
    // Authenticate the user via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Create a client with the user's token to verify identity
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for data queries
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: shelf, error } = await supabase
      .from('user_bookshelf')
      .select(`
        book_id,
        status,
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

    // Build taste signals from explicit ratings first; un-rated books are
    // weaker evidence. Genres and authors rated highly receive more weight.
    const genreScores: Record<string, number> = {};
    const authorScores: Record<string, number> = {};
    const excludeIds = new Set<string>();

    for (const item of shelf ?? []) {
      excludeIds.add(item.book_id);
      const book = Array.isArray(item.books_library) ? item.books_library[0] : item.books_library;
      if (!book) continue;

      const rating = typeof item.rating === 'number' ? item.rating : null;
      const signal = rating === null ? 0.5 : rating >= 4 ? rating : rating <= 2 ? rating - 3 : 0.25;
      const statusWeight = item.status === 'completed' ? 1.15 : item.status === 'currently_reading' ? 1 : 0.8;
      const weight = signal * statusWeight;

      if (book.genre) genreScores[book.genre] = (genreScores[book.genre] || 0) + weight;
      if (book.author && rating !== null && rating >= 4) {
        authorScores[book.author] = (authorScores[book.author] || 0) + rating;
      }
    }

    const hasTasteSignals = Object.keys(genreScores).length > 0 || Object.keys(authorScores).length > 0;
    let candidateQuery = supabase
      .from('books_library')
      .select('id, title, author, genre, cover_image_url, description')
      .limit(100);

    if (excludeIds.size) {
      candidateQuery = candidateQuery.not('id', 'in', `(${[...excludeIds].join(',')})`);
    }

    const { data: candidates, error: candidateError } = await candidateQuery;
    if (candidateError) throw candidateError;

    const recommendations = (candidates ?? [])
      .map((book) => {
        const genreScore = book.genre ? genreScores[book.genre] || 0 : 0;
        const authorScore = book.author ? authorScores[book.author] || 0 : 0;
        return { book, score: genreScore + authorScore * 0.35 };
      })
      .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title))
      .slice(0, 5)
      .map(({ book }) => book);

    // New readers still receive fresh catalog picks rather than an empty list.
    const fallback = hasTasteSignals ? recommendations : (candidates ?? []).slice(0, 5);

    return new Response(
      JSON.stringify({ recommendations: fallback }),
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
