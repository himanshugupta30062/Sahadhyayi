// Generate a platform-tailored share caption using Lovable AI Gateway (Gemini)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Platform = 'twitter' | 'facebook' | 'linkedin' | 'instagram';

const PLATFORM_RULES: Record<Platform, string> = {
  twitter:
    'Write a punchy tweet under 240 characters. Include 2-4 relevant hashtags. Hook the reader. Do NOT include the URL (it will be appended).',
  facebook:
    'Write a warm, conversational Facebook post (2-4 short paragraphs, ~80-150 words). End with an inviting question. No hashtags spam — at most 2-3.',
  linkedin:
    'Write a professional LinkedIn post (~120-180 words). Open with a strong insight, share 2-3 takeaways as short lines, end with a thoughtful question. Use 3-5 relevant hashtags at the end.',
  instagram:
    'Write an engaging Instagram caption (~80-150 words) with line breaks for readability. Use emojis tastefully. End with 8-12 relevant hashtags on a separate line.',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { platform, title, subtitle, content, url } = await req.json();

    if (!platform || !title || !PLATFORM_RULES[platform as Platform]) {
      return new Response(JSON.stringify({ error: 'Invalid platform or missing title' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const excerpt = String(content || '').replace(/\s+/g, ' ').trim().slice(0, 1500);

    const systemPrompt =
      'You are a social media copywriter for Sahadhyayi, a community for book readers. Write authentic, engaging share copy that drives clicks. Never use clickbait. Output ONLY the caption text — no preamble, no quotes, no explanation.';

    const userPrompt = `Platform: ${platform}
Rules: ${PLATFORM_RULES[platform as Platform]}

Article title: ${title}
${subtitle ? `Subtitle: ${subtitle}\n` : ''}Article excerpt: ${excerpt}
${url ? `Article URL (do NOT include unless platform rules say so): ${url}` : ''}

Write the caption now.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const t = await aiResp.text();
      console.error('AI gateway error', aiResp.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResp.json();
    const caption: string = data?.choices?.[0]?.message?.content?.trim() ?? '';

    return new Response(JSON.stringify({ caption }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-share-caption error', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
