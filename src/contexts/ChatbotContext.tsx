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
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const toggleChat = () => setIsOpen((prev) => !prev);
  const closeChat = () => setIsOpen(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { sender: 'user', text }]);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
        },
      );

      if (!resp.ok) {
        throw new Error('Failed to fetch Gemini response');
      }

      const data = await resp.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        'Sorry, I could not understand.';

      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, something went wrong.' },
      ]);
    }
  };

  return (
    <ChatbotContext.Provider value={{ isOpen, messages, toggleChat, closeChat, sendMessage }}>
      {children}
    </ChatbotContext.Provider>
  );
};
