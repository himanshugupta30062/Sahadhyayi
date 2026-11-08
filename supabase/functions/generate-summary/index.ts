
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthenticatedUser, corsHeaders } from '../_shared/auth.ts';
import { enforceRateLimit } from '../_shared/rateLimit.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { user, errorResponse } = await getAuthenticatedUser(req);
  if (errorResponse) return errorResponse;

  // Rate limit: max 20 summary requests per 10 minutes per user
  const rateLimitErr = await enforceRateLimit(req, {
    endpoint: 'generate-summary',
    identifier: user.id,
    maxRequests: 20,
    windowMinutes: 10,
    customMessage: 'Summary generation limit reached. Please wait a few moments before requesting more summaries.',
  });
  if (rateLimitErr) return rateLimitErr;

  try {
    const { content, type = 'chapter' } = await req.json();
    
    if (!content) {
      throw new Error('Content is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = type === 'book' 
      ? `Create a comprehensive 15-minute audio summary of this book content. Focus on key themes, main plot points, character development, and important takeaways. Make it engaging and informative:\n\n${content}`
      : `Summarize this chapter highlighting the key points, developments, and important details in a concise but comprehensive way:\n\n${content}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: type === 'book' 
              ? 'You are an expert book summarizer. Create engaging, comprehensive summaries that capture the essence of books in about 15 minutes of content.'
              : 'You are an expert reading assistant. Create concise yet comprehensive chapter summaries that help readers understand and remember key points.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: type === 'book' ? 2000 : 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-summary function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
