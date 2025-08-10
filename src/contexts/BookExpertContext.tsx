import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface BookExpertContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  toggleChat: () => void;
  sendMessage: (text: string) => Promise<void>;
}

const BookExpertContext = createContext<BookExpertContextType | undefined>(undefined);

export const useBookExpert = () => {
  const ctx = useContext(BookExpertContext);
  if (!ctx) {
    throw new Error('useBookExpert must be used within BookExpertProvider');
  }
  return ctx;
};

export const BookExpertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: "Hello! I'm your Book Expert. How can I help you today?" }
  ]);

  const toggleChat = () => setIsOpen(prev => !prev);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);

  try {
      const { data, error } = await supabase.functions.invoke('book-expert-gemini', {
        body: { text },
      });

      if (error) {
        throw error;
      }

      const reply = data?.reply ?? 'Sorry, I could not process your request at the moment.';
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    } catch (error) {
      console.error('BookExpert error:', error);
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I encountered an error while processing your request. Please try again later.' },
      ]);
    }
  };

  return (
    <BookExpertContext.Provider value={{ isOpen, messages, toggleChat, sendMessage }}>
      {children}
    </BookExpertContext.Provider>
  );
};

export default BookExpertProvider;
