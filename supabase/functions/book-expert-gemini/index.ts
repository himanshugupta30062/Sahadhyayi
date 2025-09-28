import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Handle CORS dynamically to support multiple allowed origins
const ALLOWED_ORIGINS = [
  "https://rknxtatvlzunatpyqxro.supabase.co",
  "https://www.sahadhyayi.com",
  "https://sahadhyayi.com",
  "https://lovable.app",
  "http://localhost:8080",
  "*" // Allow all origins for development
];

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };

  headers["Access-Control-Allow-Origin"] = "*";

  return headers;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Valid text input is required');
    }
    
    if (text.length > 2000) {
      throw new Error('Text input too long. Maximum 2000 characters allowed.');
    }
    
    // Basic input sanitization
    const sanitizedText = text.trim().replace(/[<>]/g, '');

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY environment variable not set');
      throw new Error('API configuration error');
    }

    console.log('Gemini API key found, length:', geminiApiKey.length);

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
