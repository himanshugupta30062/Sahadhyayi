import { supabase } from '@/integrations/supabase/client';
import { useEnhancedGeminiTraining } from '@/hooks/useEnhancedGeminiTraining';
import {
  getWebsiteContext,
  searchRelevantBooks,
  getBookSummaries,
  BookData,
} from '@/utils/enhancedChatbotKnowledge';
import { generateContextualResponse } from '@/utils/chatbotKnowledge';
import { useCallback } from 'react';

export function useChatbotAI() {
  const {
    initializeWebsiteKnowledge,
    saveChatInteraction,
    saveBookSpecificInteraction,
    exportTrainingData,
    getTrainingDataStats,
  } = useEnhancedGeminiTraining();

  const queryAI = useCallback(
    async (userMessage: string) => {
      let relevantBooks: BookData[] = [];
      await initializeWebsiteKnowledge();

      const websiteContext = await getWebsiteContext();
      relevantBooks = await searchRelevantBooks(userMessage, 3);
      if (relevantBooks.length > 0) {
        await getBookSummaries(relevantBooks.map((b) => b.id));
      }
      const enhancedPrompt = userMessage;
      let contextualPrompt = enhancedPrompt;
      if (relevantBooks.length > 0) {
        contextualPrompt += '\n\nRELEVANT BOOKS:\n';
        relevantBooks.forEach((book) => {
          contextualPrompt += `• "${book.title}" by ${book.author} (${book.genre})\n`;
        });
      }

      const { data, error } = await supabase.functions.invoke('enhanced-book-summary', {
        body: {
          prompt: contextualPrompt,
          context: 'chatbot_response',
          bookContext: relevantBooks.length > 0 ? relevantBooks : undefined,
        },
      });

      let botResponse = '';
      if (error) {
        botResponse = generateContextualResponse(userMessage);
      } else if (data?.response) {
        botResponse = data.response;
      } else {
        botResponse = generateContextualResponse(userMessage);
      }

      await saveChatInteraction(userMessage, botResponse, 'enhanced_chat');
      if (relevantBooks.length > 0) {
        await saveBookSpecificInteraction(
          relevantBooks[0].id,
          relevantBooks[0].title,
          userMessage,
          botResponse,
        );
      }
      const trainingDataCount = await getTrainingDataStats();
      return { text: botResponse, books: relevantBooks, trainingDataCount };
    },
    [
      initializeWebsiteKnowledge,
      saveChatInteraction,
      saveBookSpecificInteraction,
      getTrainingDataStats,
    ],
  );

  return { queryAI, exportTrainingData, initializeWebsiteKnowledge };
}
