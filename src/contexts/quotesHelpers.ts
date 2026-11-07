import { createContext, useContext } from 'react';

export interface Quote {
  id: number;
  text: string;
  source?: string;
  note?: string;
  bookId?: string;
  page?: number;
  location?: string;
}

interface QuotesContextType {
  quotes: Quote[];
  addQuote: (text: string, source?: string, note?: string, metadata?: { bookId?: string; page?: number; location?: string }) => void;
  removeQuote: (id: number) => void;
}

export const QuotesContext = createContext<QuotesContextType | undefined>(undefined);

export const useQuotes = () => {
  const context = useContext(QuotesContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
};
