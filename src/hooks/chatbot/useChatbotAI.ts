import { useCallback } from 'react';
import { useChatbot } from '@/contexts/ChatbotContext';

export function useChatbotAI() {
  const { sendMessage: ctxSend, initializeWebsiteKnowledge, saveChatInteraction } = useChatbot();

  const ask = useCallback(async (text: string) => {
    const reply = await ctxSend(text);
    try {
      await saveChatInteraction?.(text, reply, 'general_chat');
    } catch (err) {
      console.error(err);
    }
    return reply;
  }, [ctxSend, saveChatInteraction]);

  return { ask, initializeWebsiteKnowledge };
}
