
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGeminiTraining } from '@/hooks/useGeminiTrainingData';
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

// Website knowledge base for the Book Expert
const WEBSITE_KNOWLEDGE = `
SAHADHYAYI DIGITAL LIBRARY - COMPREHENSIVE GUIDE

ABOUT THE PLATFORM:
- Sahadhyayi is a comprehensive digital library and reading community
- Features 10,000+ books across multiple genres and languages
- Offers free PDF downloads and community-driven features
- Supports social reading, book discussions, and author connections

MAIN FEATURES:

1. DIGITAL LIBRARY (/library):
   - Browse 10,000+ books by genre, author, language
   - Free PDF downloads available
   - Advanced search and filtering
   - Books include: Fiction, Non-fiction, Science, Hindi literature, Devotional, Biography, History
   - Each book has detailed information: author bio, description, ratings, publication details

2. READING DASHBOARD (/dashboard):
   - Personal bookshelf management
   - Reading progress tracking
   - Reading goals and statistics
   - Current reads section
   - Book recommendations based on preferences

3. SOCIAL FEATURES (/reviews, /social-media):
   - Reading community discussions
   - Book reviews and ratings
   - Friend connections and reading groups
   - Social feed with reading updates
   - Book-based conversations and recommendations

4. AUTHOR CONNECTION (/authors):
   - Detailed author profiles and biographies
   - Author books and statistics
   - Direct messaging with authors
   - Author events and sessions
   - Author discovery by genre and location

5. PERSONALIZATION:
   - User profiles with reading preferences
   - Customizable reading goals
   - Personal reading statistics
   - Book wishlists and favorites

6. ADVANCED FEATURES:
   - AI-powered book summaries
   - Audio summaries for books
   - Page-by-page reading progress
   - Book continuation and user-generated content
   - Multi-language support (English, Hindi, etc.)

NAVIGATION:
- Home: Main landing page with featured content
- Library: Browse and search books
- Dashboard: Personal reading management
- Authors: Author discovery and connection
- Social/Reviews: Community features
- Profile: User account management

BOOK INTERACTION:
- Users can add books to different statuses: "Want to Read", "Currently Reading", "Completed"
- Download PDFs directly from book pages
- Access book summaries and audio summaries
- Track reading progress with detailed statistics
- Leave reviews and ratings

COMMUNITY FEATURES:
- Join reading groups and discussions
- Connect with fellow readers
- Share reading progress and recommendations
- Participate in book-related conversations
- Follow authors and get updates

TECHNICAL FEATURES:
- Responsive design for all devices
- Real-time notifications
- Advanced search capabilities
- Multi-language support
- Secure user authentication
- Cloud-based book storage
`;

export const ChatbotProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { saveSample } = useGeminiTraining();

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(async (userMessage: string) => {
    // Add user message
    const userMsg: Message = {
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);

    try {
      // Enhanced context for the AI
      const enhancedPrompt = `
You are the Book Expert AI for Sahadhyayi Digital Library. You help users with book recommendations, library features, and platform navigation.

CONTEXT ABOUT THE PLATFORM:
${WEBSITE_KNOWLEDGE}

USER QUERY: ${userMessage}

INSTRUCTIONS:
- Provide specific, actionable responses about books and platform features
- Reference actual platform sections when relevant (e.g., "Visit the Library section", "Check your Dashboard")
- For book recommendations, consider genres available: Fiction, Science, Hindi literature, Devotional, Biography, History
- If users ask about features, explain how to access them on the platform
- Keep responses helpful, concise, and focused on books and reading
- If you don't know something specific, suggest where they can find more information on the platform

Please provide a helpful response:`;

      const { data, error } = await supabase.functions.invoke('enhanced-book-summary', {
        body: { 
          prompt: enhancedPrompt,
          context: 'chatbot_response'
        }
      });

      if (error) throw error;

      const botResponse = data?.response || "I'm here to help you with books and reading! Could you please rephrase your question?";

      // Add bot response
      const botMsg: Message = {
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMsg]);

      // Save interaction for training
      await saveSample(enhancedPrompt, botResponse);

    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Fallback response with website knowledge
      const fallbackResponse = generateFallbackResponse(userMessage);
      
      const botMsg: Message = {
        text: fallbackResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      toast({
        title: "Connection Issue",
        description: "Using offline knowledge to help you!",
        variant: "default",
      });
    }
  }, [saveSample]);

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

// Fallback response generator using website knowledge
const generateFallbackResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();
  
  if (message.includes('book') && message.includes('find')) {
    return "To find books, visit our Library section where you can browse 10,000+ books by genre, author, or language. Use the search bar to find specific titles or authors. You can filter by Fiction, Science, Hindi literature, Devotional, Biography, and History.";
  }
  
  if (message.includes('read') && (message.includes('track') || message.includes('progress'))) {
    return "Track your reading progress in the Dashboard section! You can set reading goals, monitor your current reads, view statistics, and manage your personal bookshelf with different statuses like 'Currently Reading' and 'Completed'.";
  }
  
  if (message.includes('author')) {
    return "Explore our Authors section to discover author profiles, read their biographies, browse their books, and even connect with them directly. You can search authors by genre and location, and attend author events.";
  }
  
  if (message.includes('download') || message.includes('pdf')) {
    return "Yes! Sahadhyayi offers free PDF downloads for books in our library. Simply visit any book's detail page and click the 'Download PDF' button. We have thousands of books available for free download.";
  }
  
  if (message.includes('social') || message.includes('community')) {
    return "Join our reading community! Visit the Social Media or Reviews sections to connect with fellow readers, join reading groups, share book reviews, participate in discussions, and get personalized recommendations from other readers.";
  }
  
  if (message.includes('recommend') || message.includes('suggestion')) {
    return "I'd love to help with book recommendations! We have books across many genres including Fiction, Science, Hindi literature, Devotional texts, Biographies, and History. What genre or topic interests you most? You can also check your Dashboard for personalized recommendations based on your reading history.";
  }
  
  if (message.includes('help') || message.includes('how')) {
    return "I'm here to help you navigate Sahadhyayi! You can:\n• Browse 10,000+ books in the Library\n• Track reading in your Dashboard\n• Connect with Authors\n• Join the reading community in Social/Reviews\n• Download free PDFs\n• Get book recommendations\n\nWhat specific feature would you like to know more about?";
  }
  
  return "Welcome to Sahadhyayi Digital Library! I'm your Book Expert AI assistant. I can help you find books, track your reading progress, connect with authors, and navigate our community features. What would you like to know about books or our platform?";
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
