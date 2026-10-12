
import { supabase } from '@/integrations/supabase/client-universal';
import {
  detectBookSchemaCapabilities,
  applyPublicBookFilter,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility';

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
    const caps = await detectBookSchemaCapabilities();

    // Get total unique books count (matching library catalog deduplication)
    const titleSelect = ['id', 'title'];
    if (caps.hasStatus) titleSelect.push('status');
    if (caps.hasCatalogStatus) titleSelect.push('catalog_status');

    let titleQuery = supabase
      .from('books_library')
      .select(titleSelect.join(','));
    titleQuery = applyPublicBookFilter(titleQuery, caps);

    const { data: titleData, error: titleError } = await titleQuery;

    let totalBooks = 0;
    if (!titleError && Array.isArray(titleData) && titleData.length > 0) {
      const visible = filterPublicBooks(titleData);
      const uniqueTitles = new Set<string>();
      visible.forEach((b: { title?: string | null }) => {
        const key = (b.title || '').trim().toLowerCase();
        if (key) uniqueTitles.add(key);
      });
      totalBooks = uniqueTitles.size;
    } else {
      let countQuery = supabase
        .from('books_library')
        .select('*', { count: 'exact', head: true });
      countQuery = applyPublicBookFilter(countQuery, caps);
      const { count } = await countQuery;
      totalBooks = count || 0;
    }

    // Get available genres
    const genreSelect = ['id', 'genre'];
    if (caps.hasStatus) genreSelect.push('status');
    if (caps.hasCatalogStatus) genreSelect.push('catalog_status');

    let genreQuery = supabase
      .from('books_library')
      .select(genreSelect.join(','))
      .not('genre', 'is', null);
    genreQuery = applyPublicBookFilter(genreQuery, caps);

    const { data: genreData } = await genreQuery;
    const visibleGenres = filterPublicBooks(genreData || []);
    const genres = [...new Set(visibleGenres.map((item: { genre: string }) => item.genre).filter(Boolean))] as string[];

    // Get recent books
    const bookSelect = ['id', 'title', 'author', 'genre', 'description', 'language'];
    if (caps.hasStatus) bookSelect.push('status');
    if (caps.hasCatalogStatus) bookSelect.push('catalog_status');

    let recentQuery = supabase
      .from('books_library')
      .select(bookSelect.join(','))
      .order('created_at', { ascending: false });
    recentQuery = applyPublicBookFilter(recentQuery, caps);

    const { data: recentBooksRaw } = await recentQuery.limit(20);
    const recentBooks = filterPublicBooks(recentBooksRaw || []).slice(0, 10);

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

export const generateEnhancedPrompt = (
  userMessage: string,
  context: WebsiteContext,
): string => {
  const { totalBooks, genres, features, recentBooks } = context;
  let prompt =
    'You are an AI assistant for the Sahadhyayi digital library. Use the website context to answer user questions.\n\n';
  prompt += `Total books in library: ${totalBooks}.\n`;
  if (genres.length > 0) {
    prompt += `Available genres include: ${genres.join(', ')}.\n`;
  }
  if (features.length > 0) {
    prompt += `Key features: ${features.join(', ')}.\n`;
  }
  if (recentBooks.length > 0) {
    prompt += 'Recent books:\n';
    recentBooks.slice(0, 3).forEach((book) => {
      prompt += `- "${book.title}" by ${book.author} (${book.genre})\n`;
    });
  }
  prompt += `\nUser query: ${userMessage}\n`;
  prompt += 'Provide a concise and helpful response referencing the context when relevant.';
  return prompt;
};

export const searchRelevantBooks = async (query: string, limit: number = 5): Promise<BookData[]> => {
  try {
    const caps = await detectBookSchemaCapabilities();
    const bookSelect = ['id', 'title', 'author', 'genre', 'description', 'language'];
    if (caps.hasStatus) bookSelect.push('status');
    if (caps.hasCatalogStatus) bookSelect.push('catalog_status');

    let queryBuilder = supabase
      .from('books_library')
      .select(bookSelect.join(','))
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%,genre.ilike.%${query}%`);

    queryBuilder = applyPublicBookFilter(queryBuilder, caps);

    const { data, error } = await queryBuilder.limit(limit * 2);

    if (error) throw error;
    return filterPublicBooks(data || []).slice(0, limit);
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
