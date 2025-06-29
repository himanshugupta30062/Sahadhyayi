
import React, { createContext, useContext, useState } from 'react';

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface ChatbotContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  toggleChat: () => void;
  closeChat: () => void;
  sendMessage: (text: string) => Promise<void>;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbot = () => {
  const ctx = useContext(ChatbotContext);
  if (!ctx) {
    throw new Error('useChatbot must be used within ChatbotProvider');
  }
  return ctx;
};

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Hello! I\'m your Book Expert AI assistant. I can help you with book recommendations, literary discussions, reading tips, and more. What would you like to know?' }
  ]);

  const toggleChat = () => setIsOpen((prev) => !prev);
  const closeChat = () => setIsOpen(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message immediately
    setMessages((prev) => [...prev, { sender: 'user', text }]);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Sorry, the Gemini API key is not configured. Please check your environment variables.' },
        ]);
        return;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ 
              parts: [{ 
                text: `You are Book Expert, a knowledgeable AI assistant specializing in books, literature, reading recommendations, and literary discussions. You help users discover new books, understand literary concepts, discuss authors and their works, and provide reading guidance. Please provide helpful, engaging, and well-informed responses about books and literature. User question: ${text}` 
              }] 
            }] 
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        'Sorry, I could not process your request at the moment.';

      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I encountered an error while processing your request. Please try again later.' },
      ]);
    }
  };

  return (
    <ChatbotContext.Provider value={{ isOpen, messages, toggleChat, closeChat, sendMessage }}>
      {children}
    </ChatbotContext.Provider>
  );
};
