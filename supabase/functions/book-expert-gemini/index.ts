import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 20,
  windowMinutes: 1
}

async function checkRateLimit(supabaseClient: any, identifier: string, endpoint: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: RATE_LIMIT.maxRequests,
      p_window_minutes: RATE_LIMIT.windowMinutes
    })
    
    if (error) {
      console.error('Rate limit check error:', error)
      return true
    }
    
    return data === true
  } catch (error) {
    console.error('Rate limit exception:', error)
    return true
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Get client identifier
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   'unknown'

  // Check rate limit
  const isAllowed = await checkRateLimit(supabaseClient, clientIP, 'book-expert-gemini')
  if (!isAllowed) {
    console.log(`🚫 Rate limit exceeded for IP: ${clientIP}`)
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Valid text input is required');
    }
    
    if (text.length > 2000) {
      throw new Error('Text input too long. Maximum 2000 characters allowed.');
    }
    
    const sanitizedText = text.trim().replace(/[<>]/g, '');

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY environment variable not set');
      throw new Error('API configuration error');
    }

    console.log('Gemini API key found, processing request for IP:', clientIP);

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `You are a helpful AI book expert for Sahadhyayi. Please provide concise, accurate responses related to books, reading, and literature. User question: ${sanitizedText}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ??
      'Sorry, I could not process your request at the moment.';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in book-expert-gemini function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});