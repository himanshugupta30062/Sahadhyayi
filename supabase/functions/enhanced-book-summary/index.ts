
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('Gemini API key not configured')
      throw new Error('Gemini API key not configured')
    }

    console.log('Gemini API key found, proceeding with request')

    let finalPrompt = ''
    let isBookSummary = false

    // Check if this is a chatbot response request
    if (context === 'chatbot_response' && prompt) {
      finalPrompt = prompt
      console.log('Processing chatbot response request')
    } else {
      // This is a book summary request
      isBookSummary = true
      let contentIdentifier = ''

      switch (summaryType) {
        case 'page_range':
          finalPrompt = `Create a comprehensive 15-minute summary of pages ${pageStart} to ${pageEnd} from the book "${bookTitle}". 
          Focus on key concepts, plot developments, character insights, and important themes from this specific section. 
          Structure the summary to be engaging and easy to understand in approximately 15 minutes of reading time.
          Include practical takeaways and connections to the broader narrative.`
          contentIdentifier = `pages ${pageStart}-${pageEnd}`
          break
        
        case 'chapter':
          finalPrompt = `Create a detailed 15-minute summary of Chapter ${chapterNumber} from the book "${bookTitle}". 
          Highlight the main events, character development, key concepts, and how this chapter advances the overall story or argument. 
          Make it comprehensive yet concise for a 15-minute reading experience.
          Include memorable quotes if applicable and connect to previous chapters.`
          contentIdentifier = `Chapter ${chapterNumber}`
          break
        
        default: // 'full_book'
          finalPrompt = `Create an engaging 15-minute summary of the entire book "${bookTitle}". 
          Cover the main themes, key arguments, plot points, character arcs, and most important takeaways. 
          Structure it as a cohesive narrative that captures the essence of the book while being accessible to someone who hasn't read it. 
          Include practical applications and why this book matters.
          Make it compelling enough to either satisfy a reader's curiosity or inspire them to read the full book.`
          contentIdentifier = 'Full Book'
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

    // Call Gemini API with improved error handling
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
            temperature: context === 'chatbot_response' ? 0.7 : 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: context === 'chatbot_response' ? 1024 : 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    )

    console.log('Gemini API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Gemini API request failed with status ${response.status}:`, errorText)
      throw new Error(`Gemini API request failed with status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('Gemini API response data:', JSON.stringify(data, null, 2))

    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedContent) {
      console.error('No content generated by Gemini API. Full response:', data)
      throw new Error('No content generated by Gemini API')
    }

    console.log('Generated content length:', generatedContent.length)

    // For book summaries, save to database
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
      } else {
        console.log('Book summary saved successfully')
      }

      return new Response(
        JSON.stringify({ 
          summary: generatedContent,
          summaryType,
          contentIdentifier: summaryType === 'page_range' ? `pages ${pageStart}-${pageEnd}` : 
                           summaryType === 'chapter' ? `Chapter ${chapterNumber}` : 'Full Book',
          savedSummary: savedSummary || null
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    } else {
      // For chatbot responses, return the generated content
      console.log('Chatbot response generated successfully')

      return new Response(
        JSON.stringify({ 
          response: generatedContent
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

  } catch (error) {
    console.error('Error in enhanced-book-summary function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate content',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
