
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export interface TrainingDataPoint {
  prompt: string;
  completion: string;
  category: string;
  context: string;
  metadata?: Record<string, any>;
}

export const useEnhancedGeminiTraining = () => {
  const { user } = useAuth();

  const saveTrainingData = useCallback(async (data: TrainingDataPoint) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('gemini_training_data')
        .insert({
          user_id: user.id,
          prompt: JSON.stringify({
            original_prompt: data.prompt,
            category: data.category,
            context: data.context,
            metadata: data.metadata || {},
            timestamp: new Date().toISOString(),
            platform: 'sahadhyayi'
          }),
          completion: data.completion,
        });

      if (error) {
        console.error('Error saving training data:', error);
      } else {
        console.log('Training data saved successfully');
      }
    } catch (error) {
      console.error('Error saving training data:', error);
    }
  }, [user?.id]);

  const initializeWebsiteKnowledge = useCallback(async () => {
    if (!user?.id) return;

    console.log('Initializing website knowledge base...');

    // Core website information
    const websiteKnowledge = [
      {
        prompt: "What is Sahadhyayi?",
        completion: "Sahadhyayi is a comprehensive digital library platform dedicated to reviving reading culture. It offers 10,000+ books across multiple genres including Fiction, Science, Hindi Literature, Devotional texts, Biographies, and History. The platform provides free PDF downloads, reading progress tracking, author connections, and a vibrant reading community.",
        category: "platform_overview",
        context: "website_knowledge"
      },
      {
        prompt: "What features does Sahadhyayi offer?",
        completion: "Sahadhyayi offers several key features:\n• Digital Library (/library): Browse 10,000+ books with advanced search and filtering\n• Reading Dashboard (/dashboard): Track progress, set goals, manage bookshelf\n• Author Connection (/authors): Connect with authors, read bios, attend virtual events\n• Social Reading (/reviews): Join reading groups, share reviews, connect with readers\n• Free PDF Downloads: All books are available for free download\n• Reading Progress Tracking: Monitor your reading journey\n• Book Recommendations: AI-powered suggestions based on preferences",
        category: "features",
        context: "website_knowledge"
      },
      {
        prompt: "How do I find books on Sahadhyayi?",
        completion: "You can find books on Sahadhyayi through multiple ways:\n1. Visit the Library section (/library) to browse our 10,000+ collection\n2. Use the search bar to find specific titles, authors, or topics\n3. Filter by genre: Fiction, Science, Hindi Literature, Devotional, Biography, History\n4. Filter by language, publication year, or other criteria\n5. Browse trending books and recommendations\n6. Get AI-powered recommendations based on your reading preferences",
        category: "book_discovery",
        context: "website_knowledge"
      },
      {
        prompt: "What genres are available on Sahadhyayi?",
        completion: "Sahadhyayi offers books across 6 main genres:\n• Fiction: Literary masterpieces, contemporary novels, short stories\n• Science: Physics, biology, technology guides, scientific breakthroughs\n• Hindi Literature: Classical and modern Hindi texts, poetry collections\n• Devotional: Sacred scriptures, spiritual guides, religious philosophy\n• Biography: Autobiographies, historical figures, leadership stories\n• History: World history, cultural heritage, ancient civilizations\n\nEach genre has hundreds of carefully curated titles from renowned authors.",
        category: "genres",
        context: "website_knowledge"
      },
      {
        prompt: "How do I track my reading progress?",
        completion: "Track your reading progress on Sahadhyayi through:\n• Dashboard (/dashboard): Your personal reading command center\n• Set reading goals: Daily, weekly, or monthly targets\n• Monitor progress: See completion percentages and time spent\n• Bookshelf management: Organize books by status (reading, completed, want to read)\n• Reading statistics: View detailed analytics of your reading habits\n• Chapter-by-chapter tracking: Mark progress as you read\n• Achievement system: Earn badges for reading milestones",
        category: "progress_tracking",
        context: "website_knowledge"
      },
      {
        prompt: "How do I connect with authors?",
        completion: "Connect with authors on Sahadhyayi through:\n• Authors section (/authors): Browse comprehensive author profiles\n• Direct messaging: Send messages to authors\n• Virtual events: Attend author sessions and Q&A\n• Author biographies: Read detailed backgrounds and inspirations\n• Book collections: Explore complete works by each author\n• Follow system: Stay updated with your favorite authors\n• Social features: Join author-led reading groups and discussions",
        category: "author_connection",
        context: "website_knowledge"
      },
      {
        prompt: "What social features does Sahadhyayi have?",
        completion: "Sahadhyayi's social features include:\n• Reading Community (/reviews): Connect with fellow book lovers\n• Book Reviews: Share detailed reviews and ratings\n• Reading Groups: Join or create book clubs\n• Discussion Forums: Participate in book discussions\n• Friend System: Connect with other readers\n• Social Discovery: Find books through community recommendations\n• Reading Circles: Share your current reads with friends\n• Location Sharing: See readers near you on the map",
        category: "social_features",
        context: "website_knowledge"
      },
      {
        prompt: "How do I download books from Sahadhyayi?",
        completion: "Downloading books from Sahadhyayi is simple:\n1. Browse the Library or find your desired book\n2. Click on the book to open its detail page\n3. Click the 'Download PDF' button\n4. The book will download as a free PDF file\n5. All 10,000+ books are available for free download\n6. No subscription or payment required\n7. Books can be read offline after download\n\nWe believe in making knowledge accessible to everyone, so all our books are completely free.",
        category: "download_process",
        context: "website_knowledge"
      }
    ];

    // Save all website knowledge
    for (const knowledge of websiteKnowledge) {
      await saveTrainingData(knowledge);
    }

    console.log('Website knowledge base initialized successfully');
  }, [saveTrainingData]);

  const saveChatInteraction = useCallback(async (
    userMessage: string,
    botResponse: string,
    context: string = 'general_chat'
  ) => {
    await saveTrainingData({
      prompt: userMessage,
      completion: botResponse,
      category: 'chat_interaction',
      context,
      metadata: {
        interaction_type: 'chatbot',
        platform: 'sahadhyayi',
        timestamp: new Date().toISOString()
      }
    });
  }, [saveTrainingData]);

  const saveBookSpecificInteraction = useCallback(async (
    bookId: string,
    bookTitle: string,
    userQuery: string,
    aiResponse: string
  ) => {
    await saveTrainingData({
      prompt: `Book: ${bookTitle}\nUser Query: ${userQuery}`,
      completion: aiResponse,
      category: 'book_specific',
      context: 'book_interaction',
      metadata: {
        book_id: bookId,
        book_title: bookTitle,
        interaction_type: 'book_query'
      }
    });
  }, [saveTrainingData]);

  const exportTrainingData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gemini_training_data')
        .select('prompt, completion, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedData = data.map(item => ({
        input: JSON.parse(item.prompt),
        output: item.completion,
        timestamp: item.created_at
      }));

      const blob = new Blob([JSON.stringify(formattedData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gemini_training_data_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      console.log(`Exported ${formattedData.length} training samples`);
    } catch (error) {
      console.error('Error exporting training data:', error);
    }
  }, [user?.id]);

  return {
    saveTrainingData,
    initializeWebsiteKnowledge,
    saveChatInteraction,
    saveBookSpecificInteraction,
    exportTrainingData
  };
};
