export type Intent = 'book_query' | 'general' | 'help' | 'policy';

export interface SiteContext {
  totalBooks: number;
  topGenres: string[];
}

export interface BookCtx {
  id: string;
  title: string;
  author?: string;
  snippet?: string; // short summary/excerpt
}

export interface AiContext {
  site: SiteContext;
  books: BookCtx[];
}

export interface AiRequest {
  question: string;
  intent: Intent;
  ctx: AiContext;
  promptVersion: 'V1' | 'V2';
}

export interface AiResponse {
  reply: string;
  references: Array<{ bookId?: string; title?: string }>;
  followup?: string;
}
