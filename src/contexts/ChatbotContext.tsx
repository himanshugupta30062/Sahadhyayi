
import React, { createContext, useContext, useState } from 'react';
import { useGeminiTraining } from '@/hooks/useGeminiTrainingData';

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: Date;
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
    { 
      sender: 'bot', 
      text: 'Hello! I\'m your enhanced Book Expert AI assistant. I can help you with:\n\n📚 Personalized book recommendations\n📖 Literary analysis and discussions\n✍️ Reading tips and strategies\n🎯 Book club suggestions\n📝 Reading goal planning\n🔍 Author insights and biographies\n\nWhat would you like to explore today?',
      timestamp: new Date()
    }
  ]);
  const { saveSample } = useGeminiTraining();

  const toggleChat = () => setIsOpen((prev) => !prev);
  const closeChat = () => setIsOpen(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message immediately
    const userMessage: ChatMessage = { sender: 'user', text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        const errorMessage: ChatMessage = {
          sender: 'bot',
          text: 'Sorry, the Gemini API key is not configured. Please check your environment variables.',
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      // Enhanced prompt with more context and personality
      const enhancedPrompt = `You are Book Expert, an advanced AI literary companion with deep knowledge of books, literature, and reading culture. You have expertise in:

- Global literature across genres, cultures, and time periods
- Reading comprehension strategies and speed reading techniques
- Book club facilitation and discussion questions
- Author biographies, writing styles, and literary movements
- Publishing trends and book market insights
- Reading goal setting and tracking
- Personalized recommendations based on mood, interests, and reading level

Context: You're helping readers discover their next great read, understand complex literary concepts, and enhance their reading journey. Be engaging, knowledgeable, and encouraging.

User question: ${text}

Please provide a helpful, informative response that demonstrates your literary expertise while being conversational and encouraging.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ 
              parts: [{ text: enhancedPrompt }] 
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        'Sorry, I could not process your request at the moment. Please try rephrasing your question.';

      const botMessage: ChatMessage = {
        sender: 'bot',
        text: reply,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
      
      // Save training data for future improvements
      saveSample(text, reply).catch((err) =>
        console.error('Failed to save training data:', err),
      );
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: ChatMessage = {
        sender: 'bot',
        text: 'I apologize, but I encountered an error while processing your request. Please try again in a moment, or rephrase your question.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <ChatbotContext.Provider value={{ isOpen, messages, toggleChat, closeChat, sendMessage }}>
      {children}
    </ChatbotContext.Provider>
  );
};
