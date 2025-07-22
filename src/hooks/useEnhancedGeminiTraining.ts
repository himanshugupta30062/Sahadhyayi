
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TrainingDataMetrics {
  totalSamples: number;
  categorizedSamples: {
    book_recommendations: number;
    book_discussions: number;
    platform_navigation: number;
    general_queries: number;
  };
  recentActivity: number;
}

export const useEnhancedGeminiTraining = () => {
  const { user } = useAuth();

  const saveEnhancedTrainingSample = async (
    userQuery: string,
    aiResponse: string,
    category: string,
    bookContext?: {
      bookId?: string;
      bookTitle?: string;
      author?: string;
      genre?: string;
    }
  ) => {
    try {
      if (!user?.id) {
        console.log('User not authenticated, skipping training data save');
        return;
      }

      // Create enhanced prompt with rich context
      const enhancedPrompt = {
        platform: 'sahadhyayi_digital_library',
        timestamp: new Date().toISOString(),
        category: category,
        user_query: userQuery,
        book_context: bookContext || null,
        conversation_context: {
          user_type: 'reader',
          platform_section: window.location.pathname,
          session_duration: Date.now()
        }
      };

      const { error } = await supabase
        .from('gemini_training_data')
        .insert({
          user_id: user.id,
          prompt: JSON.stringify(enhancedPrompt),
          completion: aiResponse,
        });

      if (error) {
        console.error('Error saving enhanced training data:', error);
      } else {
        console.log('Enhanced training data saved successfully for category:', category);
      }
    } catch (error) {
      console.error('Error in enhanced training save:', error);
    }
  };

  const getTrainingMetrics = async (): Promise<TrainingDataMetrics | null> => {
    try {
      const { data, error } = await supabase
        .from('gemini_training_data')
        .select('prompt, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const metrics: TrainingDataMetrics = {
        totalSamples: data.length,
        categorizedSamples: {
          book_recommendations: 0,
          book_discussions: 0,
          platform_navigation: 0,
          general_queries: 0,
        },
        recentActivity: 0,
      };

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      data.forEach((sample) => {
        try {
          const promptData = JSON.parse(sample.prompt);
          const category = promptData.category || 'general_queries';
          
          if (metrics.categorizedSamples.hasOwnProperty(category)) {
            metrics.categorizedSamples[category as keyof typeof metrics.categorizedSamples]++;
          } else {
            metrics.categorizedSamples.general_queries++;
          }

          if (new Date(sample.created_at) > oneWeekAgo) {
            metrics.recentActivity++;
          }
        } catch (e) {
          metrics.categorizedSamples.general_queries++;
        }
      });

      return metrics;
    } catch (error) {
      console.error('Error fetching training metrics:', error);
      return null;
    }
  };

  const exportTrainingDataForFineTuning = async () => {
    try {
      const { data, error } = await supabase
        .from('gemini_training_data')
        .select('prompt, completion, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Format data for Gemini fine-tuning
      const formattedData = data.map((sample, index) => ({
        id: index + 1,
        input: sample.prompt,
        output: sample.completion,
        metadata: {
          timestamp: sample.created_at,
          platform: 'sahadhyayi'
        }
      }));

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(formattedData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sahadhyayi_gemini_training_data_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return formattedData;
    } catch (error) {
      console.error('Error exporting training data:', error);
      return null;
    }
  };

  return {
    saveEnhancedTrainingSample,
    getTrainingMetrics,
    exportTrainingDataForFineTuning,
  };
};
