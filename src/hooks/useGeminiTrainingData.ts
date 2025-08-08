
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Enhanced hook for saving training data with better context and categorization
 */
export const useGeminiTraining = () => {
  const { user } = useAuth();

  const saveSample = async (prompt: string, completion: string, category: string = 'general') => {
    try {
      // Only save if user is authenticated
      if (!user?.id) {
        console.log('User not authenticated, skipping training data save');
        return;
      }

      // Enhanced training data with metadata
      const trainingData = {
        user_id: user.id,
        prompt: prompt,
        completion: completion,
        category: category,
        timestamp: new Date().toISOString(),
        platform_context: 'sahadhyayi_digital_library',
        interaction_type: 'chatbot'
      };

      const { error } = await supabase
        .from('gemini_training_data')
        .insert({
          user_id: user.id,
          prompt: JSON.stringify({
            original_prompt: prompt,
            metadata: {
              category,
              timestamp: trainingData.timestamp,
              platform: trainingData.platform_context,
              interaction: trainingData.interaction_type
            }
          }),
          completion: completion,
        });

      if (error) {
        console.error('Error saving Gemini training data:', error);
      } else {
        console.log('Enhanced training data saved successfully');
      }
    } catch (error) {
      console.error('Error saving Gemini training data:', error);
    }
  };

  const saveBookInteraction = async (bookId: string, userQuery: string, aiResponse: string) => {
    const enhancedPrompt = `
BOOK_INTERACTION_CONTEXT:
Book ID: ${bookId}
User Query: ${userQuery}
Context: Book-specific interaction on Sahadhyayi platform
`;
    await saveSample(enhancedPrompt, aiResponse, 'book_interaction');
  };

  const saveFeatureExplanation = async (feature: string, userQuery: string, aiResponse: string) => {
    const enhancedPrompt = `
FEATURE_EXPLANATION_CONTEXT:
Platform Feature: ${feature}
User Query: ${userQuery}
Context: Platform navigation and feature explanation
`;
    await saveSample(enhancedPrompt, aiResponse, 'feature_explanation');
  };

  return { 
    saveSample, 
    saveBookInteraction, 
    saveFeatureExplanation 
  };
};
