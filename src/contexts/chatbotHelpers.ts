import { createContext, useContext } from 'react';

export interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  references?: Array<{ bookId?: string; title?: string }>;
}

export interface ChatbotContextType {
  isOpen: boolean;
  messages: Message[];
  toggleChat: () => void;
  closeChat: () => void;
  sendMessage: (message: string) => Promise<string>;
  isLoading: boolean;
  trainingDataCount: number;
  initializeWebsiteKnowledge?: () => Promise<void>;
  saveChatInteraction?: (userMessage: string, botResponse: string, context?: string) => Promise<void>;
}

export const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
