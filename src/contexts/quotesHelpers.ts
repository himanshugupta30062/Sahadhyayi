import { createContext, useContext } from 'react';

export interface Quote {
  id: number | string;
  text: string;
  source?: string;
  note?: string;
  bookId?: string;
  page?: number;
  location?: string;
  createdAt?: string;
}

interface QuotesContextType {
  quotes: Quote[];
  addQuote: (text: string, source?: string, note?: string, metadata?: { bookId?: string; page?: number; location?: string }) => void;
  removeQuote: (id: number | string) => void;
}

/** Cloud records win for matching IDs; local-only quotes are retained once. */
export const mergeQuotes = (cloud: Quote[], local: Quote[]): Quote[] => {
  const cloudIds = new Set(cloud.map(q => String(q.id)));
  const localOnly = local.filter(q => !cloudIds.has(String(q.id)));
  const seen = new Set<string>();
  return [...cloud, ...localOnly].filter(q => {
    const id = String(q.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export const QuotesContext = createContext<QuotesContextType | undefined>(undefined);

export const useQuotes = () => {
  const context = useContext(QuotesContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
};
