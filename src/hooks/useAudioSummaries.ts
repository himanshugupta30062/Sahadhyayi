
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

export type AudioSummary = {
  id: string;
  book_id: string | null;
  audio_url: string;
  duration_seconds: number;
  transcript: string | null;
  created_at: string;
  updated_at: string;
};

export const useAudioSummary = (bookId: string) => {
  return useQuery({
    queryKey: ['audio_summary', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_audio_summaries')
        .select('*')
        .eq('book_id', bookId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateAudioSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { bookId: string; content: string }) => {
      // Generate text summary first
      const summaryResponse = await supabase.functions.invoke('generate-summary', {
        body: { content: params.content, type: 'book' }
      });
      
      if (summaryResponse.error) {
        throw new Error(summaryResponse.error.message);
      }
      
      const { summary } = summaryResponse.data;
      
      // Generate audio from summary
      const audioResponse = await supabase.functions.invoke('generate-audio', {
        body: { text: summary, voice: 'alloy' }
      });
      
      if (audioResponse.error) {
        throw new Error(audioResponse.error.message);
      }
      
      const { audioContent } = audioResponse.data;
      const audioBlob = new Blob([Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))], { type: 'audio/mp3' });
      
      // Upload audio to storage (you'll need to create this bucket)
      const fileName = `audio-summary-${params.bookId}-${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-summaries')
        .upload(fileName, audioBlob);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('audio-summaries')
        .getPublicUrl(fileName);
      
      // Save to database
      const { data, error } = await supabase
        .from('book_audio_summaries')
        .upsert({
          book_id: params.bookId,
          audio_url: publicUrl,
          duration_seconds: 900, // 15 minutes
          transcript: summary,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio_summary'] });
    },
  });
};
