
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Save a prompt/response pair for later Gemini training.
 */
export const useGeminiTraining = () => {
  const { user } = useAuth();

  const saveSample = async (prompt: string, completion: string) => {
    try {
      // Use a more flexible approach that doesn't depend on the exact type definitions
      const { error } = await supabase
        .from('gemini_training_data' as any)
        .insert({
          user_id: user?.id ?? null,
          prompt,
          completion,
        });

      if (error) {
        console.error('Error saving Gemini training data:', error);
      }
    } catch (error) {
      console.error('Error saving Gemini training data:', error);
    }
  };

  return { saveSample };
};
