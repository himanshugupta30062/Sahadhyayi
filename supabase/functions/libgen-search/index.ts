import { serve } from 'https://deno.land/std/http/server.ts';
import { parseLibgenHtml } from './parser.ts';

serve(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) {
      return new Response(JSON.stringify({ error: 'Missing q' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const resp = await fetch(`https://libgen.is/search.php?req=${encodeURIComponent(q)}&res=25&column=title`);
    const html = await resp.text();
    const books = parseLibgenHtml(html).slice(0, 25);
    return new Response(JSON.stringify({ success: true, books }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'EDGE_LIBGEN_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
