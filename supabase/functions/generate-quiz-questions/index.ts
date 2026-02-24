import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId, difficulty = 'medium', count = 10 } = await req.json();

    if (!bookId) {
      return new Response(
        JSON.stringify({ error: 'Book ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch book details
    const { data: book, error: bookError } = await supabase
      .from('books_library')
      .select('id, title, author, genre, description')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      console.error('Book fetch error:', bookError);
      return new Response(
        JSON.stringify({ error: 'Book not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we already have enough questions for this book
    const { data: existingQuestions, error: questionsError } = await supabase
      .from('book_quiz_questions')
      .select('*')
      .eq('book_id', bookId)
      .eq('difficulty', difficulty);

    if (!questionsError && existingQuestions && existingQuestions.length >= count) {
      // Return existing questions (shuffled)
      const shuffled = existingQuestions.sort(() => Math.random() - 0.5).slice(0, count);
      return new Response(
        JSON.stringify({ questions: shuffled, source: 'cached' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new questions using Gemini
    if (!geminiApiKey) {
      // Return fallback questions if no API key
      const fallbackQuestions = generateFallbackQuestions(book, difficulty, count);
      return new Response(
        JSON.stringify({ questions: fallbackQuestions, source: 'fallback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pointsMap: Record<string, number> = { easy: 50, medium: 100, hard: 200 };
    const points = pointsMap[difficulty] || 100;

    const prompt = `You are a book quiz master. Generate ${count} multiple-choice questions about the book "${book.title}" by ${book.author || 'Unknown Author'}.

Book details:
- Genre: ${book.genre || 'General'}
- Description: ${book.description || 'A popular book'}

Requirements:
1. Questions should test knowledge about the book's themes, characters, plot, author, and literary elements
2. Each question should have exactly 4 options (A, B, C, D)
3. Only one answer should be correct
4. Difficulty level: ${difficulty}
   - Easy: Basic facts about the book, obvious answers
   - Medium: Deeper understanding, some analysis required
   - Hard: Expert-level, nuanced questions about themes and symbolism
5. Include a helpful hint for each question
6. Include an explanation for the correct answer

Return ONLY a valid JSON array with this exact structure (no markdown, no code blocks):
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "hint": "A helpful hint",
    "explanation": "Why this is the correct answer"
  }
]

Make questions engaging and educational. Correct answer index should be 0-3.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text());
      const fallbackQuestions = generateFallbackQuestions(book, difficulty, count);
      return new Response(
        JSON.stringify({ questions: fallbackQuestions, source: 'fallback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the JSON response
    let questions;
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Text:', generatedText);
      const fallbackQuestions = generateFallbackQuestions(book, difficulty, count);
      return new Response(
        JSON.stringify({ questions: fallbackQuestions, source: 'fallback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store questions in database for caching
    const questionsToInsert = questions.map((q: any) => ({
      book_id: bookId,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      difficulty,
      points,
      hint: q.hint,
      explanation: q.explanation,
    }));

    await supabase.from('book_quiz_questions').insert(questionsToInsert);

    return new Response(
      JSON.stringify({ questions: questionsToInsert, source: 'generated' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quiz-questions:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateFallbackQuestions(book: any, difficulty: string, count: number) {
  const pointsMap: Record<string, number> = { easy: 50, medium: 100, hard: 200 };
  const points = pointsMap[difficulty] || 100;

  const templates = [
    {
      question: `Who is the author of "${book.title}"?`,
      options: [book.author || 'Unknown', 'William Shakespeare', 'Jane Austen', 'Charles Dickens'],
      correct_answer: 0,
      hint: 'Check the book cover!',
      explanation: `${book.author || 'Unknown'} wrote this book.`
    },
    {
      question: `What genre does "${book.title}" belong to?`,
      options: [book.genre || 'Fiction', 'Science Fiction', 'Romance', 'Horror'],
      correct_answer: 0,
      hint: 'Think about the main themes.',
      explanation: `This book is classified as ${book.genre || 'Fiction'}.`
    },
    {
      question: `Which of these best describes "${book.title}"?`,
      options: [
        book.description?.substring(0, 50) + '...' || 'An engaging story',
        'A cookbook with recipes',
        'A travel guide',
        'A technical manual'
      ],
      correct_answer: 0,
      hint: 'Read the book summary.',
      explanation: 'This describes the book accurately.'
    },
    {
      question: `In what language was "${book.title}" originally published?`,
      options: ['English', 'French', 'Spanish', 'German'],
      correct_answer: 0,
      hint: 'Most books in our library are in English.',
      explanation: 'This book was published in English.'
    },
    {
      question: `What makes "${book.title}" a notable work?`,
      options: [
        'Its compelling narrative and characters',
        'It was written in one day',
        'It has no chapters',
        'It was never published'
      ],
      correct_answer: 0,
      hint: 'Think about why people read books.',
      explanation: 'Books are valued for their storytelling.'
    }
  ];

  return templates.slice(0, count).map(q => ({
    ...q,
    book_id: book.id,
    difficulty,
    points
  }));
}
