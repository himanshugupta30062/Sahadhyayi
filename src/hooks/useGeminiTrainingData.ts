import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Save a prompt/response pair for later Gemini training.
 */
export const useGeminiTraining = () => {
  const { user } = useAuth();

  const saveSample = async (prompt: string, completion: string) => {
    try {
      await supabase.from('gemini_training_data').insert({
        user_id: user?.id ?? null,
        prompt,
        completion,
      });
    } catch (error) {
      console.error('Error saving Gemini training data:', error);
    }
  };

  return { saveSample };
};
