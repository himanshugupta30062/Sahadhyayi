import type { Author } from '@/hooks/useAuthors';
import type { Book } from '@/hooks/useLibraryBooks';

type AuthorRecord = {
  id: string;
  name: string;
  bio?: string | null;
  profile_image_url?: string | null;
  location?: string | null;
  website_url?: string | null;
  social_links?: Record<string, string> | null;
  genres?: string[] | null;
  actual_books_count?: string | number | null;
  followers_count?: string | number | null;
  rating?: string | number | null;
  upcoming_events?: string | number | null;
  created_at: string;
  updated_at: string;
  verified?: boolean | null;
  verification_type?: string | null;
};

type AuthorBookRecord = {
  id: string;
  title: string;
  author?: string | null;
  genre?: string;
  cover_image_url?: string;
  description?: string;
  publication_year?: number;
  language?: string | null;
  pdf_url?: string;
  created_at: string;
  isbn?: string;
  pages?: number;
  author_bio?: string;
};

/** Convert the RPC author row into the stable frontend author model. */
export function mapAuthorRecord(author: AuthorRecord): Author {
  return {
    id: author.id,
    name: author.name,
    bio: author.bio || null,
    profile_image_url: author.profile_image_url || null,
    location: author.location || '',
    website_url: author.website_url || null,
    social_links: author.social_links || {},
    genres: author.genres || [],
    books_count: Number.parseInt(String(author.actual_books_count ?? 0), 10) || 0,
    followers_count: Number(author.followers_count) || 0,
    rating: Number.parseFloat(String(author.rating ?? 0)) || 0,
    upcoming_events: Number(author.upcoming_events) || 0,
    created_at: author.created_at,
    updated_at: author.updated_at,
    verified: author.verified || false,
    verification_type: author.verification_type || undefined,
    availableSlots: [],
  };
}

/** Convert a public books_library row into the author-book view model. */
export function mapAuthorBook(book: AuthorBookRecord): Book {
  return {
    id: book.id,
    title: book.title,
    author: book.author || 'Unknown Author',
    genre: book.genre,
    cover_image_url: book.cover_image_url,
    description: book.description,
    publication_year: book.publication_year,
    language: book.language || 'English',
    pdf_url: book.pdf_url,
    created_at: book.created_at,
    price: 0,
    isbn: book.isbn,
    pages: book.pages,
    author_bio: book.author_bio,
  };
}
