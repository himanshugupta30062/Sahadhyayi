import React, { createContext, useContext, useState } from 'react';

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface BookExpertContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  toggleChat: () => void;
  closeChat: () => void;
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
  const closeChat = () => setIsOpen(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        setMessages(prev => [
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
                text: `You are a helpful AI book expert for Sahadhyayi. Please provide concise responses related to books, reading, and literature. User question: ${text}`
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
    <BookExpertContext.Provider value={{ isOpen, messages, toggleChat, closeChat, sendMessage }}>
      {children}
    </BookExpertContext.Provider>
  );
};

export default BookExpertProvider;
