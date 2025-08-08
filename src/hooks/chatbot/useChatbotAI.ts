import { useEnhancedGeminiTraining } from '@/hooks/useEnhancedGeminiTraining';
import { generateContextualResponse } from '@/utils/chatbotKnowledge';
import { useCallback } from 'react';
import * as ai from '@/ai/service';
import type { AiContext } from '@/ai/types';

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
      let relevantBooks: AiContext['books'] = [];
      await initializeWebsiteKnowledge();

      try {
        const result = await ai.ask(userMessage);
        relevantBooks = result.references.map(r => ({
          id: r.bookId || '',
          title: r.title || '',
          author: undefined,
          snippet: undefined,
        }));

        await saveChatInteraction(userMessage, result.reply, 'enhanced_chat');
        if (relevantBooks.length > 0) {
          await saveBookSpecificInteraction(
            relevantBooks[0].id,
            relevantBooks[0].title,
            userMessage,
            result.reply,
          );
        }
        const trainingDataCount = await getTrainingDataStats();
        return { text: result.reply, books: relevantBooks, trainingDataCount };
      } catch (error) {
        console.error('Chatbot error:', error);
        const fallback = generateContextualResponse(userMessage);
        const trainingDataCount = await getTrainingDataStats();
        return { text: fallback, books: relevantBooks, trainingDataCount };
      }
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
