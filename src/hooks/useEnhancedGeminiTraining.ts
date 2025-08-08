
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import * as React from 'react';
import { populateInitialTrainingData } from '@/utils/enhancedChatbotKnowledge';

export interface TrainingDataPoint {
  prompt: string;
  completion: string;
  category: string;
  context: string;
  metadata?: Record<string, any>;
}

export const useEnhancedGeminiTraining = () => {
  const { user } = useAuth();

  const saveTrainingData = React.useCallback(async (data: TrainingDataPoint) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('gemini_training_data')
        .insert({
          user_id: user.id,
          prompt: JSON.stringify({
            original_prompt: data.prompt,
            category: data.category,
            context: data.context,
            metadata: data.metadata || {},
            timestamp: new Date().toISOString(),
            platform: 'sahadhyayi'
          }),
          completion: data.completion,
        });

      if (error) {
        console.error('Error saving training data:', error);
      } else {
        console.log('Training data saved successfully');
      }
    } catch (error) {
      console.error('Error saving training data:', error);
    }
  }, [user?.id]);

  const initializeWebsiteKnowledge = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      // Check if training data already exists
      const { data: existingData, error: checkError } = await supabase
        .from('gemini_training_data')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (checkError) {
        console.error('Error checking existing training data:', checkError);
        return;
      }

      // If no data exists, populate with initial training data
      if (!existingData || existingData.length === 0) {
        console.log('No existing training data found, populating initial data...');
        await populateInitialTrainingData(user.id);
      } else {
        console.log('Training data already exists, skipping initialization');
      }
    } catch (error) {
      console.error('Error initializing website knowledge:', error);
    }
  }, [user?.id]);

  const saveChatInteraction = React.useCallback(async (
    userMessage: string,
    botResponse: string,
    context: string = 'general_chat'
  ) => {
    await saveTrainingData({
      prompt: userMessage,
      completion: botResponse,
      category: 'chat_interaction',
      context,
      metadata: {
        interaction_type: 'chatbot',
        platform: 'sahadhyayi',
        timestamp: new Date().toISOString(),
        response_length: botResponse.length
      }
    });
  }, [saveTrainingData]);

  const saveBookSpecificInteraction = React.useCallback(async (
    bookId: string,
    bookTitle: string,
    userQuery: string,
    aiResponse: string
  ) => {
    await saveTrainingData({
      prompt: `Book: ${bookTitle}\nUser Query: ${userQuery}`,
      completion: aiResponse,
      category: 'book_specific',
      context: 'book_interaction',
      metadata: {
        book_id: bookId,
        book_title: bookTitle,
        interaction_type: 'book_query',
        response_length: aiResponse.length
      }
    });
  }, [saveTrainingData]);

  const exportTrainingData = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('gemini_training_data')
        .select('prompt, completion, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedData = data.map(item => ({
        input: JSON.parse(item.prompt),
        output: item.completion,
        timestamp: item.created_at
      }));

      const blob = new Blob([JSON.stringify(formattedData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gemini_training_data_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      console.log(`Exported ${formattedData.length} training samples`);
    } catch (error) {
      console.error('Error exporting training data:', error);
    }
  }, [user?.id]);

  const getTrainingDataStats = React.useCallback(async () => {
    if (!user?.id) return 0;

    try {
      const { count, error } = await supabase
        .from('gemini_training_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting training data stats:', error);
      return 0;
    }
  }, [user?.id]);

  return {
    saveTrainingData,
    initializeWebsiteKnowledge,
    saveChatInteraction,
    saveBookSpecificInteraction,
    exportTrainingData,
    getTrainingDataStats
  };
};
