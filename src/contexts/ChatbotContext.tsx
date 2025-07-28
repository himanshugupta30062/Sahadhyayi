
import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedGeminiTraining } from '@/hooks/useEnhancedGeminiTraining';
import { getWebsiteContext, generateEnhancedPrompt, searchRelevantBooks, getBookSummaries, BookData } from '@/utils/enhancedChatbotKnowledge';
import { generateContextualResponse } from '@/utils/chatbotKnowledge';
import { toast } from '@/hooks/use-toast';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  books?: BookData[];
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

const ChatbotContext = React.createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [trainingDataCount, setTrainingDataCount] = React.useState(0);
  
  const { 
    initializeWebsiteKnowledge, 
    saveChatInteraction, 
    saveBookSpecificInteraction,
    getTrainingDataStats
  } = useEnhancedGeminiTraining();

  // Initialize knowledge base and get stats
  React.useEffect(() => {
    const initializeKnowledge = async () => {
      if (!isInitialized) {
        try {
          await initializeWebsiteKnowledge();
          const count = await getTrainingDataStats();
          setTrainingDataCount(count);
          setIsInitialized(true);
          console.log(`Chatbot initialized with ${count} training samples`);
        } catch (error) {
          console.error('Failed to initialize knowledge base:', error);
        }
      }
    };

    initializeKnowledge();
  }, [initializeWebsiteKnowledge, isInitialized, getTrainingDataStats]);

  const toggleChat = React.useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeChat = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = React.useCallback(async (userMessage: string) => {
    let relevantBooks: BookData[] = [];
    console.log('User message received:', userMessage);
    
    // Add user message
    const userMsg: Message = {
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Get website context
      const websiteContext = await getWebsiteContext();
      
      // Search for relevant books
      relevantBooks = await searchRelevantBooks(userMessage, 3);
      
      // Get book summaries if relevant
      const bookSummaries = relevantBooks.length > 0 
        ? await getBookSummaries(relevantBooks.map(b => b.id))
        : [];

      // Generate enhanced prompt with context
      const enhancedPrompt = await generateEnhancedPrompt(userMessage, websiteContext);
      
      // Add relevant content to prompt if found
      let contextualPrompt = enhancedPrompt;
      if (relevantBooks.length > 0) {
        contextualPrompt += '\n\nRELEVANT BOOKS:\n';
        relevantBooks.forEach(book => {
          contextualPrompt += `• "${book.title}" by ${book.author} (${book.genre})\n`;
        });
      }

      console.log('Calling enhanced-book-summary function with enhanced prompt');

      // Call Supabase Edge Function for AI response
      const { data, error } = await supabase.functions.invoke('enhanced-book-summary', {
        body: { 
          prompt: contextualPrompt,
          context: 'chatbot_response',
          bookContext: relevantBooks.length > 0 ? relevantBooks : undefined
        }
      });

      console.log('Function response:', { data, error });

      let botResponse = "";

      if (error) {
        console.error('Function call error:', error);
        // Use contextual fallback with website knowledge
        botResponse = generateContextualResponse(userMessage);
        
        toast({
          title: "Using Offline Mode",
          description: "Chatbot is working with local knowledge!",
          variant: "default",
        });
      } else if (data?.response) {
        console.log('AI response received:', data.response);
        botResponse = data.response;
      } else {
        console.log('No response from AI, using contextual fallback');
        botResponse = generateContextualResponse(userMessage);
      }

      // Add bot response
      const botMsg: Message = {
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        books: relevantBooks,
      };
      
      setMessages(prev => [...prev, botMsg]);

      // Save interaction for training
      await saveChatInteraction(userMessage, botResponse, 'enhanced_chat');

      // Save book-specific interaction if relevant
      if (relevantBooks.length > 0) {
        await saveBookSpecificInteraction(
          relevantBooks[0].id,
          relevantBooks[0].title,
          userMessage,
          botResponse
        );
      }

      // Update training data count
      const newCount = await getTrainingDataStats();
      setTrainingDataCount(newCount);

    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Use contextual fallback
      const fallbackResponse = generateContextualResponse(userMessage);
      
      const botMsg: Message = {
        text: fallbackResponse,
        sender: 'bot',
        timestamp: new Date(),
        books: relevantBooks,
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      toast({
        title: "Using Offline Mode",
        description: "Chatbot is working with local knowledge!",
        variant: "default",
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
  const context = React.useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
