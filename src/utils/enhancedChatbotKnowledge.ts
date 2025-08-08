
import { supabase } from '@/integrations/supabase/client';

export interface BookData {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  language: string;
}

export interface WebsiteContext {
  totalBooks: number;
  genres: string[];
  features: string[];
  recentBooks: BookData[];
}

export const getWebsiteContext = async (): Promise<WebsiteContext> => {
  try {
    // Get total books count
    const { count: totalBooks } = await supabase
      .from('books_library')
      .select('*', { count: 'exact', head: true });

    // Get available genres
    const { data: genreData } = await supabase
      .from('books_library')
      .select('genre')
      .not('genre', 'is', null);

    const genres = [...new Set(genreData?.map(item => item.genre).filter(Boolean))];

    // Get recent books
    const { data: recentBooks } = await supabase
      .from('books_library')
      .select('id, title, author, genre, description, language')
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      totalBooks: totalBooks || 0,
      genres,
      features: [
        'Digital Library with 10,000+ books',
        'Free PDF downloads',
        'Reading progress tracking',
        'Author connections',
        'Social reading community',
        'Book recommendations',
        'Reading goals and statistics'
      ],
      recentBooks: recentBooks || []
    };
  } catch (error) {
    console.error('Error fetching website context:', error);
    return {
      totalBooks: 10000,
      genres: ['Fiction', 'Science', 'Hindi Literature', 'Devotional', 'Biography', 'History'],
      features: ['Digital Library', 'Free Downloads', 'Progress Tracking', 'Author Connections'],
      recentBooks: []
    };
  }
};

export const generateEnhancedPrompt = async (
  userMessage: string,
  context: WebsiteContext,
): Promise<string> => {
  const recent = context.recentBooks
    .slice(0, 3)
    .map((b) => `${b.title} by ${b.author}`)
    .join(', ');

  return (
    `${userMessage}\n\n` +
    `SITE INFO:\n` +
    `Total Books: ${context.totalBooks}\n` +
    `Genres: ${context.genres.join(', ')}\n` +
    `Features: ${context.features.join(', ')}\n` +
    (recent ? `Recent Books: ${recent}` : '')
  );
};

export const searchRelevantBooks = async (query: string, limit: number = 5): Promise<BookData[]> => {
  try {
    const { data, error } = await supabase
      .from('books_library')
      .select('id, title, author, genre, description, language')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%,genre.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
};

export const getBookSummaries = async (bookIds: string[]): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('book_summaries')
      .select('content, book_id, books_library(title, author)')
      .in('book_id', bookIds)
      .limit(3);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching book summaries:', error);
    return [];
  }
};

export const populateInitialTrainingData = async (userId: string) => {
  const trainingData = [
    {
      prompt: JSON.stringify({
        original_prompt: "What is Sahadhyayi?",
        category: "platform_overview",
        context: "website_knowledge",
        metadata: {
          timestamp: new Date().toISOString(),
          platform: "sahadhyayi",
          interaction_type: "knowledge_base"
        }
      }),
      completion: "Sahadhyayi is a digital library platform with 10,000+ free books across Fiction, Science, Hindi Literature, Devotional, Biography, and History genres. You can download PDFs for free, track reading progress, and connect with authors and readers."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "How do I find books?",
        category: "book_discovery",
        context: "website_knowledge",
        metadata: {
          timestamp: new Date().toISOString(),
          platform: "sahadhyayi",
          interaction_type: "navigation"
        }
      }),
      completion: "Visit /library to browse our collection, use the search bar for specific titles/authors, or filter by genre. You can also get personalized recommendations based on your reading preferences."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "What features does Sahadhyayi offer?",
        category: "features",
        context: "website_knowledge",
        metadata: {
          timestamp: new Date().toISOString(),
          platform: "sahadhyayi",
          interaction_type: "features"
        }
      }),
      completion: "Key features include: free PDF downloads, reading progress tracking (/dashboard), author connections (/authors), social reading community (/social), book recommendations, and reading goals. All books are completely free to access."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "How do I download books?",
        category: "download_process",
        context: "website_knowledge",
        metadata: {
          timestamp: new Date().toISOString(),
          platform: "sahadhyayi",
          interaction_type: "process"
        }
      }),
      completion: "Find any book in our library, click on it to open the detail page, then click 'Download PDF'. All 10,000+ books are completely free to download with no registration required."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "Tell me about Hindi literature",
        category: "genre_specific",
        context: "book_collection",
        metadata: {
          timestamp: new Date().toISOString(),
          platform: "sahadhyayi",
          interaction_type: "genre_inquiry"
        }
      }),
      completion: "Our Hindi Literature collection includes classical and modern Hindi texts, poetry collections, and works by renowned Hindi authors. Browse the /library section and filter by 'Hindi Literature' to explore our extensive collection."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "Can I track my reading progress?",
        category: "progress_tracking",
        context: "website_knowledge",
        metadata: {
          timestamp: new Date().toISOString(),
          platform: "sahadhyayi",
          interaction_type: "feature_inquiry"
        }
      }),
      completion: "Yes! Visit your /dashboard to set reading goals, track progress, manage your bookshelf, and view detailed reading statistics. You can organize books by status: reading, completed, or want to read."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "How do I connect with authors?",
        category: "author_connection",
        context: "website_knowledge",
        metadata: {
          timestamp: new Date().toISOString(),
          platform: "sahadhyayi",
          interaction_type: "social_feature"
        }
      }),
      completion: "Visit /authors to browse author profiles, read their biographies, and connect with them directly. You can also attend virtual author events and join author-led reading discussions."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "What genres are available?",
        category: "genres",
        context: "book_collection",
        metadata: {
          timestamp: new Date().toISOString(),
          platform: "sahadhyayi",
          interaction_type: "collection_inquiry"
        }
      }),
      completion: "We offer 6 main genres: Fiction (novels, stories), Science (physics, biology, tech), Hindi Literature (classical, modern), Devotional (spiritual texts), Biography (life stories), and History (world, cultural heritage)."
    }
  ];

  try {
    for (const data of trainingData) {
      await supabase
        .from('gemini_training_data')
        .insert({
          user_id: userId,
          prompt: data.prompt,
          completion: data.completion,
        });
    }
    console.log('Initial training data populated successfully');
  } catch (error) {
    console.error('Error populating training data:', error);
  }
};
