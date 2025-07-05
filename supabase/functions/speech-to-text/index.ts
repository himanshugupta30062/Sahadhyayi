
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    // For now, we'll use a simple mock transcription
    // In production, you would integrate with services like:
    // - OpenAI Whisper API
    // - Google Speech-to-Text API
    // - Azure Speech Services
    // - AWS Transcribe
    
    // Mock transcription based on file duration (simulate processing)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response - in real implementation, this would be the actual transcription
    const mockTranscriptions = [
      "Hello, I would like to know more about this book.",
      "Can you recommend some similar books?",
      "What are the main themes in this story?",
      "Who is the author of this book?",
      "When was this book published?"
    ];
    
    const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    
    return new Response(
      JSON.stringify({ 
        transcription: randomTranscription,
        confidence: 0.95,
        duration: audioFile.size / 16000 // Approximate duration
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in speech-to-text function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
