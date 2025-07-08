
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Save a prompt/response pair for later Gemini training.
 */
export const useGeminiTraining = () => {
  const { user } = useAuth();

  const saveSample = async (prompt: string, completion: string) => {
    try {
      // Only save if user is authenticated
      if (!user?.id) {
        console.log('User not authenticated, skipping training data save');
        return;
      }

      const { error } = await supabase
        .from('gemini_training_data')
        .insert({
          user_id: user.id,
          prompt,
          completion,
        });

      if (error) {
        console.error('Error saving Gemini training data:', error);
      } else {
        console.log('Training data saved successfully');
      }
    } catch (error) {
      console.error('Error saving Gemini training data:', error);
    }
  };

  return { saveSample };
};
