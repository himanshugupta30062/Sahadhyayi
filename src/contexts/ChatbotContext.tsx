
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGeminiTraining } from '@/hooks/useGeminiTrainingData';
import { generateContextualResponse, BOOK_CATEGORIES, PLATFORM_FEATURES } from '@/utils/chatbotKnowledge';
import { toast } from '@/hooks/use-toast';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotContextType {
  isOpen: boolean;
  messages: Message[];
  toggleChat: () => void;
  closeChat: () => void;
  sendMessage: (message: string) => Promise<void>;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

// Enhanced website knowledge with more specific responses
const SAHADHYAYI_RESPONSES = {
  greetings: [
    "Hello! I'm here to help you explore Sahadhyayi's amazing collection of books. What can I assist you with today?",
    "Hi there! Welcome to Sahadhyayi. I can help you find books, track your reading, or connect with authors. What interests you?",
    "Greetings! I'm your Book Expert at Sahadhyayi. Whether you're looking for recommendations or need help navigating the platform, I'm here to help!"
  ],
  bookRecommendations: [
    "I'd love to recommend some great books! What genre are you in the mood for? We have excellent collections in Fiction, Science, Hindi Literature, Devotional texts, Biographies, and History.",
    "Looking for your next great read? Tell me about your interests - do you prefer fiction or non-fiction? Any particular themes that fascinate you?",
    "Book recommendations coming right up! Are you interested in contemporary fiction, classic literature, scientific discoveries, or perhaps something in Hindi?"
  ],
  helpResponses: [
    "I'm here to guide you through everything Sahadhyayi has to offer! You can browse 10,000+ books, track your reading progress, connect with authors, and join our reading community. What would you like to explore first?",
    "Let me help you navigate Sahadhyayi! Whether you want to find books in our Library, manage your reading in the Dashboard, or connect with fellow readers, I can guide you through it all.",
    "Happy to help! Sahadhyayi offers book discovery, reading tracking, author connections, and a vibrant reading community. What specific feature would you like to know about?"
  ]
};

export const ChatbotProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const { saveSample } = useGeminiTraining();

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Enhanced response generation with context awareness
  const generateIntelligentResponse = (userMessage: string, previousMessages: Message[]): string => {
    const query = userMessage.toLowerCase().trim();
    
    // Handle greetings with variety
    if (['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'].some(greeting => 
      query.startsWith(greeting) || query === greeting)) {
      return SAHADHYAYI_RESPONSES.greetings[Math.floor(Math.random() * SAHADHYAYI_RESPONSES.greetings.length)];
    }

    // Handle help requests with context
    if (['help', 'what can you do', 'how can you help', 'assist'].some(term => query.includes(term))) {
      return SAHADHYAYI_RESPONSES.helpResponses[Math.floor(Math.random() * SAHADHYAYI_RESPONSES.helpResponses.length)];
    }

    // Handle book recommendations with variety
    if (['recommend', 'suggestion', 'what should i read', 'good books', 'book recommendation'].some(term => query.includes(term))) {
      return SAHADHYAYI_RESPONSES.bookRecommendations[Math.floor(Math.random() * SAHADHYAYI_RESPONSES.bookRecommendations.length)];
    }

    // Genre-specific responses
    const mentionedGenre = BOOK_CATEGORIES.find(category => 
      query.includes(category.name.toLowerCase())
    );
    
    if (mentionedGenre) {
      return `Excellent choice! ${mentionedGenre.description}. In our ${mentionedGenre.name} section, you'll find ${mentionedGenre.popularBooks.slice(0, 2).join(' and ')} among many others. Visit our Library and filter by "${mentionedGenre.name}" to explore the full collection. Would you like specific recommendations within this genre?`;
    }

    // Feature-specific responses with more detail
    if (query.includes('library') || query.includes('browse books')) {
      return "Our Library is your gateway to 10,000+ books! You can search by title, author, or genre, filter by language, and download free PDFs. Each book page includes detailed descriptions, author bios, and reader reviews. What type of books are you looking to explore?";
    }

    if (query.includes('dashboard') || query.includes('track reading')) {
      return "Your Dashboard is your personal reading command center! Set reading goals, track your progress through books, manage your bookshelf with different reading statuses, and get personalized recommendations. You can also see your reading statistics and achievements. Want me to guide you through setting up your reading goals?";
    }

    if (query.includes('author') || query.includes('writer')) {
      return "Our Authors section lets you discover and connect with writers directly! Browse author profiles, read their biographies, explore their complete works, and even send them messages. You can also attend virtual author events and follow your favorites for updates. Are you looking for a specific author or want to discover new ones?";
    }

    if (query.includes('social') || query.includes('community') || query.includes('friends')) {
      return "Join our vibrant reading community! Connect with fellow book lovers, share reviews and recommendations, join reading groups, and participate in book discussions. You can follow other readers, see what they're reading, and discover books through social connections. Ready to connect with other readers?";
    }

    // Download and PDF related queries
    if (query.includes('download') || query.includes('pdf') || query.includes('free')) {
      return "Yes! All books in our library offer free PDF downloads. Simply visit any book's page and click the download button. We believe knowledge should be accessible to everyone. Is there a specific book you'd like to download?";
    }

    // Use the existing contextual response generator as fallback
    return generateContextualResponse(userMessage);
  };

  const sendMessage = useCallback(async (userMessage: string) => {
    // Add user message
    const userMsg: Message = {
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);

    try {
      // First try to generate an intelligent response using local knowledge
      const intelligentResponse = generateIntelligentResponse(userMessage, messages);
      
      // Update conversation context
      setConversationContext(prev => [...prev.slice(-4), userMessage]); // Keep last 5 messages for context

      // Enhanced context for AI with conversation history
      const conversationHistory = messages.slice(-3).map(m => `${m.sender}: ${m.text}`).join('\n');
      const enhancedPrompt = `
You are the Book Expert AI for Sahadhyayi Digital Library. You help users with book recommendations, library features, and platform navigation.

CONVERSATION HISTORY:
${conversationHistory}

CURRENT USER QUERY: ${userMessage}

PLATFORM CONTEXT:
- Sahadhyayi has 10,000+ books across Fiction, Science, Hindi Literature, Devotional, Biography, History
- Features: Library (/library), Dashboard (/dashboard), Authors (/authors), Social/Reviews (/reviews)
- All books offer free PDF downloads
- Users can track reading progress, set goals, and connect with authors
- Active reading community with discussions and recommendations

INSTRUCTIONS:
- Provide specific, helpful responses about books and platform features
- Don't repeat the same generic welcome message
- Be conversational and reference the conversation context
- Offer actionable next steps or ask follow-up questions
- Keep responses concise but informative
- If discussing books, mention specific genres or features available

Please provide a helpful, contextual response:`;

      // Try API call with enhanced context
      const { data, error } = await supabase.functions.invoke('enhanced-book-summary', {
        body: { 
          prompt: enhancedPrompt,
          context: 'chatbot_response',
          conversationHistory: conversationContext
        }
      });

      let botResponse = intelligentResponse; // Use intelligent response as default

      // Only use API response if it's different and better than our intelligent response
      if (!error && data?.response && data.response !== intelligentResponse && 
          !data.response.includes("Welcome to Sahadhyayi Digital Library! I'm your Book Expert AI assistant")) {
        botResponse = data.response;
      }

      // Add bot response
      const botMsg: Message = {
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMsg]);

      // Save interaction for training (only if we used API)
      if (!error && data?.response) {
        await saveSample(enhancedPrompt, botResponse, 'chatbot_conversation');
      }

    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Use intelligent response as fallback
      const fallbackResponse = generateIntelligentResponse(userMessage, messages);
      
      const botMsg: Message = {
        text: fallbackResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      toast({
        title: "Using Offline Mode",
        description: "Chatbot is working with local knowledge!",
        variant: "default",
      });
    }
  }, [messages, conversationContext, saveSample]);

  return (
    <ChatbotContext.Provider value={{
      isOpen,
      messages,
      toggleChat,
      closeChat,
      sendMessage,
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
