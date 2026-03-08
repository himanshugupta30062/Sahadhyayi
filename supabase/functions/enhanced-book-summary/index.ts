
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const authClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const requestBody = await req.json()
    const { 
      bookId, 
      bookTitle, 
      summaryType = 'full_book', 
      pageStart, 
      pageEnd, 
      chapterNumber,
      prompt,
      context,
      conversationHistory
    } = requestBody

    console.log('Enhanced function request:', { 
      bookId, 
      bookTitle, 
      summaryType, 
      context, 
      hasPrompt: !!prompt,
      promptLength: prompt?.length || 0
    })

    // Initialize Supabase client with service role for DB writes
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not configured');
      throw new Error('Gemini API key not configured');
    }

    console.log('Gemini API key found, length:', geminiApiKey.length, 'proceeding with request');

    let finalPrompt = ''
    let isBookSummary = false

    // Check if this is a chatbot response request
    if (context === 'chatbot_response' && prompt) {
      finalPrompt = prompt
      console.log('Processing chatbot response request')
    } else {
      isBookSummary = true

      switch (summaryType) {
        case 'page_range':
          finalPrompt = `Create a comprehensive 15-minute summary of pages ${pageStart} to ${pageEnd} from the book "${bookTitle}". 
          Focus on key concepts, plot developments, character insights, and important themes from this specific section. 
          Structure the summary to be engaging and easy to understand in approximately 15 minutes of reading time.
          Include practical takeaways and connections to the broader narrative.`
          break
        
        case 'chapter':
          finalPrompt = `Create a detailed 15-minute summary of Chapter ${chapterNumber} from the book "${bookTitle}". 
          Highlight the main events, character development, key concepts, and how this chapter advances the overall story or argument. 
          Make it comprehensive yet concise for a 15-minute reading experience.
          Include memorable quotes if applicable and connect to previous chapters.`
          break
        
        default:
          finalPrompt = `Create an engaging 15-minute summary of the entire book "${bookTitle}". 
          Cover the main themes, key arguments, plot points, character arcs, and most important takeaways. 
          Structure it as a cohesive narrative that captures the essence of the book while being accessible to someone who hasn't read it. 
          Include practical applications and why this book matters.
          Make it compelling enough to either satisfy a reader's curiosity or inspire them to read the full book.`
          break
      }

      if (isBookSummary) {
        finalPrompt += `

        Context: This summary is for Sahadhyayi, a platform dedicated to reviving reading culture and connecting readers with meaningful literature. 
        The summary should inspire engagement and discussion within our reading community.
        
        Format the response with:
        1. A compelling opening that hooks the reader
        2. Clear section breaks for easy reading
        3. Key insights and takeaways highlighted
        4. A conclusion that encourages further exploration
        
        Aim for approximately 1500-2000 words for optimal 15-minute reading experience.`
      }
    }

    console.log('Making request to Gemini API...')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: finalPrompt }] 
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: context === 'chatbot_response' ? 1024 : 2048,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
          ]
        }),
      }
    )

    console.log('Gemini API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Gemini API request failed with status ${response.status}:`, errorText)
      throw new Error(`Gemini API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedContent) {
      console.error('No content generated by Gemini API.')
      throw new Error('No content generated by Gemini API')
    }

    console.log('Generated content length:', generatedContent.length)

    if (isBookSummary && bookId) {
      const { data: savedSummary, error: saveError } = await supabase
        .from('book_summaries')
        .insert({
          book_id: bookId,
          summary_type: summaryType,
          content: generatedContent,
          page_start: pageStart,
          page_end: pageEnd,
          chapter_number: chapterNumber,
          duration_minutes: 15
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving summary:', saveError)
      }

      return new Response(
        JSON.stringify({ 
          summary: generatedContent,
          summaryType,
          contentIdentifier: summaryType === 'page_range' ? `pages ${pageStart}-${pageEnd}` : 
                           summaryType === 'chapter' ? `Chapter ${chapterNumber}` : 'Full Book',
          savedSummary: savedSummary || null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else {
      return new Response(
        JSON.stringify({ response: generatedContent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

  } catch (error) {
    console.error('Error in enhanced-book-summary function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
