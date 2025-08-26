export type Language = 'HI' | 'EN';
export type ReadingStatus = 'to_read' | 'reading' | 'completed';

export interface Book {
  id: string;
  title: string;
  title_hi?: string | null;
  author_id?: string | null;
  author_ids?: string[] | null;
  genres?: string[] | null;
  tags?: string[] | null;
  language: Language;
  year?: number | null;
  cost?: number | null;
  cover_url?: string | null;
  file_url?: string | null;
  popularity?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Author {
  id: string;
  name: string;
  photo_url?: string | null;
  bio?: string | null;
}

export interface UserBook {
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  progress?: number | null;
  last_opened_at?: string | null;
}

export type SortOption = 'newest' | 'popularity' | 'az' | 'za';

export interface GetBooksParams {
  q?: string;
  genres?: string[];
  language?: Language;
  price?: 'free' | 'paid';
  yearRange?: [number | undefined, number | undefined];
  sort?: SortOption;
  cursor?: string;
  limit?: number;
}
