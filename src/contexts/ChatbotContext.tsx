
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

// Predefined responses for common queries
const PREDEFINED_RESPONSES = {
  greetings: [
    "Hello! I'm here to help you explore Sahadhyayi's amazing collection of books. What can I assist you with today?",
    "Hi there! Welcome to Sahadhyayi. I can help you find books, track your reading, or connect with authors. What interests you?",
    "Greetings! I'm your Book Expert at Sahadhyayi. Whether you're looking for recommendations or need help navigating the platform, I'm here to help!"
  ],
  capabilities: [
    "I can help you with several things:\n• Find and recommend books from our 10,000+ collection\n• Guide you through our Library, Dashboard, and Authors sections\n• Help you track your reading progress and set goals\n• Connect you with authors and our reading community\n• Answer questions about specific books and authors\n\nWhat would you like to explore?",
    "Here's what I can do for you:\n• Browse our extensive book library across all genres\n• Set up reading goals and track your progress\n• Find author profiles and connect with writers\n• Help you join our reading community\n• Answer detailed questions about books and literature\n\nHow can I help you today?",
    "I'm equipped to assist you with:\n• Book discovery and personalized recommendations\n• Platform navigation (Library, Dashboard, Authors, Social)\n• Reading progress tracking and goal setting\n• Author connections and community features\n• Detailed book discussions and analysis\n\nWhat interests you most?"
  ],
  usage: [
    "Getting started is easy! Here's how to use Sahadhyayi:\n\n📚 **Library**: Browse 10,000+ books, filter by genre, and download free PDFs\n📊 **Dashboard**: Set reading goals, track progress, and manage your bookshelf\n✍️ **Authors**: Connect with writers, read bios, and attend virtual events\n👥 **Social**: Join reading groups, share reviews, and connect with fellow readers\n\nWant me to guide you through any specific section?",
    "Here's your quick guide to Sahadhyayi:\n\n1. **Discover Books**: Use our Library to search by title, author, or genre\n2. **Track Reading**: Set goals and monitor progress in your Dashboard\n3. **Connect**: Follow authors and join our reading community\n4. **Engage**: Share reviews, join discussions, and make reading social\n\nWhich feature would you like to explore first?",
    "Welcome to Sahadhyayi! Here's how to make the most of it:\n\n🔍 **Search & Discover**: Find books easily with our advanced filters\n📈 **Personal Tracking**: Monitor your reading journey and achievements\n🤝 **Community**: Connect with authors and fellow book lovers\n💬 **Discussions**: Join conversations about your favorite reads\n\nWhat aspect interests you most?"
  ]
};

// Function to check if query matches predefined patterns
const getPredefinedResponse = (query: string): string | null => {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Greeting patterns
  const greetingPatterns = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'];
  if (greetingPatterns.some(pattern => normalizedQuery.startsWith(pattern) || normalizedQuery === pattern)) {
    return PREDEFINED_RESPONSES.greetings[Math.floor(Math.random() * PREDEFINED_RESPONSES.greetings.length)];
  }
  
  // Capability/help patterns
  const helpPatterns = ['what can you do', 'help', 'how can you help', 'what are your capabilities', 'what do you do'];
  if (helpPatterns.some(pattern => normalizedQuery.includes(pattern))) {
    return PREDEFINED_RESPONSES.capabilities[Math.floor(Math.random() * PREDEFINED_RESPONSES.capabilities.length)];
  }
  
  // Usage/getting started patterns
  const usagePatterns = ['how to use', 'getting started', 'how does this work', 'guide me', 'show me around'];
  if (usagePatterns.some(pattern => normalizedQuery.includes(pattern))) {
    return PREDEFINED_RESPONSES.usage[Math.floor(Math.random() * PREDEFINED_RESPONSES.usage.length)];
  }
  
  return null;
};

// Function to search for relevant content
const searchRelevantContent = async (query: string): Promise<string | null> => {
  try {
    // Search in book summaries, titles, authors, and descriptions
    const { data: bookResults, error: bookError } = await supabase
      .from('books_library')
      .select('title, author, description, genre')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%,genre.ilike.%${query}%`)
      .limit(5);

    if (bookError) {
      console.error('Book search error:', bookError);
      return null;
    }

    // Search in book summaries
    const { data: summaryResults, error: summaryError } = await supabase
      .from('book_summaries')
      .select('content, book_id, books_library(title, author)')
      .textSearch('content', query)
      .limit(3);

    if (summaryError) {
      console.error('Summary search error:', summaryError);
    }

    // Combine results
    let contextContent = '';
    
    if (bookResults && bookResults.length > 0) {
      contextContent += 'RELEVANT BOOKS:\n';
      bookResults.forEach(book => {
        contextContent += `- "${book.title}" by ${book.author}\n  Genre: ${book.genre}\n  Description: ${book.description?.substring(0, 200)}...\n\n`;
      });
    }
    
    if (summaryResults && summaryResults.length > 0) {
      contextContent += 'RELEVANT CONTENT:\n';
      summaryResults.forEach(summary => {
        contextContent += `- From "${summary.books_library?.title}" by ${summary.books_library?.author}\n  Summary: ${summary.content.substring(0, 300)}...\n\n`;
      });
    }
    
    return contextContent.trim() || null;
  } catch (error) {
    console.error('Content search error:', error);
    return null;
  }
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

  const sendMessage = useCallback(async (userMessage: string) => {
    // Add user message
    const userMsg: Message = {
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);

    try {
      // Step 1: Check for predefined responses first
      const predefinedResponse = getPredefinedResponse(userMessage);
      
      if (predefinedResponse) {
        // Use predefined response
        const botMsg: Message = {
          text: predefinedResponse,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMsg]);
        return;
      }

      // Step 2: Search for relevant content for book-related queries
      const relevantContent = await searchRelevantContent(userMessage);
      
      if (!relevantContent) {
        // Step 3: No content found, use fallback message
        const fallbackMsg: Message = {
          text: "I couldn't find an answer yet. Try rephrasing?",
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, fallbackMsg]);
        return;
      }

      // Step 4: Generate dynamic AI response with relevant content
      const conversationHistory = messages.slice(-3).map(m => `${m.sender}: ${m.text}`).join('\n');
      
      const enhancedPrompt = `
You are the Book Expert AI for Sahadhyayi Digital Library. You help users with book recommendations, literature discussions, and platform navigation.

CONVERSATION HISTORY:
${conversationHistory}

USER QUERY: ${userMessage}

RELEVANT CONTENT FOUND:
${relevantContent}

PLATFORM CONTEXT:
- Sahadhyayi has 10,000+ books across Fiction, Science, Hindi Literature, Devotional, Biography, History
- Features: Library (/library), Dashboard (/dashboard), Authors (/authors), Social/Reviews (/reviews)
- All books offer free PDF downloads
- Users can track reading progress, set goals, and connect with authors

INSTRUCTIONS:
- Use the relevant content above to provide a personalized, detailed response
- Be conversational and reference specific books/authors from the content when relevant
- Provide actionable next steps or ask follow-up questions
- Keep responses informative but concise (2-3 paragraphs max)
- If discussing books, mention specific titles and authors from the relevant content

Provide a helpful, contextual response based on the relevant content:`;

      // Update conversation context
      setConversationContext(prev => [...prev.slice(-4), userMessage]);

      // Call AI API for dynamic response
      const { data, error } = await supabase.functions.invoke('enhanced-book-summary', {
        body: { 
          prompt: enhancedPrompt,
          context: 'chatbot_response',
          conversationHistory: conversationContext
        }
      });

      let botResponse = "I couldn't find an answer yet. Try rephrasing?";

      if (!error && data?.response) {
        botResponse = data.response;
      }

      // Add bot response
      const botMsg: Message = {
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMsg]);

      // Save interaction for training
      if (!error && data?.response) {
        await saveSample(enhancedPrompt, botResponse, 'chatbot_conversation');
      }

    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Use contextual fallback
      const fallbackResponse = generateContextualResponse(userMessage);
      
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
