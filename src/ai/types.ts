export type Intent = 'book_query' | 'general' | 'help' | 'policy';

export interface AiContext {
  site: { totalBooks: number; topGenres: string[] };
  books: Array<{ id: string; title: string; author: string; genre?: string; snippet?: string }>;
  user?: { id: string; name?: string; reading?: string[] };
}
