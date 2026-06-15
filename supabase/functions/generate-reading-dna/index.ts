import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const COLORS = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Rate limit: 1 / 5 min
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_identifier: userId,
      p_endpoint: "generate-reading-dna",
      p_max_requests: 1,
      p_window_minutes: 5,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Try again in a few minutes." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather shelf + ratings
    const { data: shelf } = await supabase
      .from("user_bookshelf")
      .select("status, books_library:book_id(title, author, genre)")
      .eq("user_id", userId)
      .limit(200);

    const items = (shelf ?? [])
      .map((r: any) => ({
        title: r.books_library?.title,
        author: r.books_library?.author,
        genre: r.books_library?.genre,
        status: r.status,
      }))
      .filter((r: any) => r.title);

    let dna: any;

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiKey && items.length > 0) {
      const prompt = `You are a literary taste analyst. Given this reader's bookshelf, return a JSON object with:
- genres: array of up to 6 {name, weight 0..1}
- moods: array of up to 6 strings (e.g. "contemplative","epic","cozy","dark","whimsical","intellectual")
- pace: one of "slow burn","steady","page-turner","varied"
- themes: array of up to 6 strings
- summary: one sentence describing this reader (max 140 chars)
- signature_color: a single hex like "#f59e0b" that fits the vibe

Books:
${items.slice(0, 60).map((b: any) => `- ${b.title} by ${b.author ?? "?"} [${b.genre ?? "?"}] (${b.status})`).join("\n")}

Return ONLY valid JSON, no markdown.`;

      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
          }),
        }
      );
      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        const text = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        try {
          dna = JSON.parse(text);
        } catch {
          dna = null;
        }
      }
    }

    if (!dna) {
      // Fallback heuristic so the feature always returns something
      const genreCounts: Record<string, number> = {};
      items.forEach((b: any) => {
        if (b.genre) genreCounts[b.genre] = (genreCounts[b.genre] ?? 0) + 1;
      });
      const total = Math.max(1, Object.values(genreCounts).reduce((a, b) => a + b, 0));
      const genres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, c]) => ({ name, weight: Number((c / total).toFixed(2)) }));
      dna = {
        genres,
        moods: ["curious", "thoughtful"],
        pace: "steady",
        themes: [],
        summary: items.length
          ? `A ${genres[0]?.name?.toLowerCase() ?? "varied"} reader with ${items.length} books on the shelf.`
          : "A fresh reader — add some books to refine your DNA.",
        signature_color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    }

    // Normalize + sanitize
    const safe = {
      user_id: userId,
      genres: Array.isArray(dna.genres) ? dna.genres.slice(0, 8) : [],
      moods: Array.isArray(dna.moods) ? dna.moods.slice(0, 8).map(String) : [],
      pace: typeof dna.pace === "string" ? dna.pace.slice(0, 40) : "steady",
      themes: Array.isArray(dna.themes) ? dna.themes.slice(0, 8).map(String) : [],
      summary: typeof dna.summary === "string" ? dna.summary.slice(0, 240) : "",
      signature_color:
        typeof dna.signature_color === "string" && /^#[0-9a-fA-F]{6}$/.test(dna.signature_color)
          ? dna.signature_color
          : COLORS[Math.floor(Math.random() * COLORS.length)],
      generated_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from("reading_dna")
      .upsert(safe, { onConflict: "user_id" });
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ dna: safe }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-reading-dna error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
