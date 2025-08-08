import React, { useEffect, useState, useCallback } from 'react';
import { useEnhancedGeminiTraining } from '@/hooks/useEnhancedGeminiTraining';
import * as ai from '@/ai/service';
import { generateContextualResponse } from '@/utils/chatbotKnowledge';
import { toast } from '@/hooks/use-toast';
import { isRateLimited } from '@/utils/validation';
import { ChatbotContext, type Message } from './chatbotHelpers';

const ChatbotProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [trainingDataCount, setTrainingDataCount] = useState(0);

  const {
    initializeWebsiteKnowledge,
    saveChatInteraction,
    saveBookSpecificInteraction,
    getTrainingDataStats
  } = useEnhancedGeminiTraining();

  // Initialize knowledge base and get stats
  useEffect(() => {
    const initializeKnowledge = async () => {
      if (!isInitialized) {
        try {
          await initializeWebsiteKnowledge();
          const count = await getTrainingDataStats();
          setTrainingDataCount(count);
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize knowledge base:', error);
        }
      }
    };

    initializeKnowledge();
  }, [initializeWebsiteKnowledge, isInitialized, getTrainingDataStats]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(async (userMessage: string) => {
    let botResponse = "";
    let references: Array<{ bookId?: string; title?: string }> = [];

    // Add user message
    const userMsg: Message = {
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);

    if (isRateLimited('chat', 10, 60000)) {
      toast({
        title: "Slow down",
        description: "Please wait before sending more messages.",
        variant: "destructive",
      });
      return "";
    }

    setIsLoading(true);

    try {
      const result = await ai.ask(userMessage);
      botResponse = result.reply;
      references = result.references;

      const botMsg: Message = {
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        references,
      };

      setMessages(prev => [...prev, botMsg]);

      await saveChatInteraction(userMessage, botResponse, 'enhanced_chat');

      if (references.length > 0 && references[0].bookId) {
        await saveBookSpecificInteraction(
          references[0].bookId!,
          references[0].title || '',
          userMessage,
          botResponse
        );
      }

      const newCount = await getTrainingDataStats();
      setTrainingDataCount(newCount);

    } catch (error) {
      console.error('Chatbot error:', error);

      const fallbackResponse = generateContextualResponse(userMessage);

      const botMsg: Message = {
        text: fallbackResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMsg]);
      botResponse = fallbackResponse;

      toast({
        title: "Using Offline Mode",
        description: "Chatbot is working with local knowledge!",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
    return botResponse;
  }, [saveChatInteraction, saveBookSpecificInteraction, getTrainingDataStats]);

  return (
    <ChatbotContext.Provider value={{
      isOpen,
      messages,
      toggleChat,
      closeChat,
      sendMessage,
      isLoading,
      trainingDataCount,
      initializeWebsiteKnowledge,
      saveChatInteraction,
    }}>
      {children}
    </ChatbotContext.Provider>
  );
};

export default ChatbotProvider;
