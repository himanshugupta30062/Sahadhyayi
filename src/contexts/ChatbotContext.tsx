
import React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedGeminiTraining } from '@/hooks/useEnhancedGeminiTraining';
import * as ai from '@/ai/service';
import type { AiContext } from '@/ai/types';
import { generateContextualResponse } from '@/utils/chatbotKnowledge';
import { toast } from '@/hooks/use-toast';
import { isRateLimited } from '@/utils/validation';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  books?: AiContext['books'];
}

interface ChatbotContextType {
  isOpen: boolean;
  messages: Message[];
  toggleChat: () => void;
  closeChat: () => void;
  sendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  trainingDataCount: number;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider = ({ children }: { children: React.ReactNode }) => {
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
    let relevantBooks: AiContext['books'] = [];

    const { data: { user } } = await supabase.auth.getUser();
    const rateKey = `chat_${user?.id || 'anon'}`;
    if (isRateLimited(rateKey, 5, 60000)) {
      toast({
        title: 'Slow down',
        description: 'Please wait before sending another message',
        variant: 'destructive',
      });
      return;
    }

    const userMsg: Message = {
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await ai.ask(userMessage);
      relevantBooks = result.references.map(r => ({
        id: r.bookId || '',
        title: r.title || '',
        author: undefined,
        snippet: undefined,
      }));

      const botMsg: Message = {
        text: result.reply,
        sender: 'bot',
        timestamp: new Date(),
        books: relevantBooks,
      };

      setMessages(prev => [...prev, botMsg]);

      await saveChatInteraction(userMessage, result.reply, 'enhanced_chat');

      if (relevantBooks.length > 0) {
        await saveBookSpecificInteraction(
          relevantBooks[0].id,
          relevantBooks[0].title,
          userMessage,
          result.reply
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
        books: relevantBooks,
      };
      setMessages(prev => [...prev, botMsg]);
      toast({
        title: 'Using Offline Mode',
        description: 'Chatbot is working with local knowledge!',
        variant: 'default',
      });
    } finally {
      setIsLoading(false);
    }
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
    }}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
