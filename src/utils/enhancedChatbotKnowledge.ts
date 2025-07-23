
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

export const generateEnhancedPrompt = async (userQuery: string, context: WebsiteContext): Promise<string> => {
  const currentDate = new Date().toLocaleDateString();
  
  return `You are the Book Expert AI for Sahadhyayi Digital Library. You are an expert on books, literature, and our platform.

PLATFORM INFORMATION:
- Website: Sahadhyayi Digital Library
- Mission: Reviving reading culture through accessible literature
- Library Size: ${context.totalBooks}+ books
- Available Genres: ${context.genres.join(', ')}
- Key Features: ${context.features.join(', ')}
- Date: ${currentDate}

RECENT BOOKS IN LIBRARY:
${context.recentBooks.map(book => 
  `• "${book.title}" by ${book.author} (${book.genre}) - ${book.description?.substring(0, 100)}...`
).join('\n')}

PLATFORM NAVIGATION:
- Library: /library (Browse all books, search, filter)
- Dashboard: /dashboard (Reading progress, goals, bookshelf)
- Authors: /authors (Connect with authors, profiles, events)
- Social: /reviews (Community, reviews, reading groups)
- Profile: /profile (User settings, preferences)

USER QUERY: ${userQuery}

INSTRUCTIONS:
1. Always respond as an expert on both books and the Sahadhyayi platform
2. Provide specific information about our book collection when relevant
3. Guide users to appropriate platform sections
4. Be conversational and helpful
5. If asked about books not in our library, acknowledge and suggest alternatives
6. Always emphasize our free access and community features
7. Keep responses informative but concise (2-3 paragraphs max)
8. Include actionable next steps when helpful

Provide a helpful, knowledgeable response about books or the platform:`;
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
