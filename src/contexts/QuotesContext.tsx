import React from 'react';

export interface Quote {
  id: number;
  text: string;
  source?: string;
  note?: string;
}

interface QuotesContextType {
  quotes: Quote[];
  addQuote: (text: string, source?: string, note?: string) => void;
  removeQuote: (id: number) => void;
}

const QuotesContext = React.createContext<QuotesContextType | undefined>(undefined);

export const useQuotes = () => {
  const context = React.useContext(QuotesContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
};

export const QuotesProvider = ({ children }: { children: React.ReactNode }) => {
  const [quotes, setQuotes] = React.useState<Quote[]>([]);

  React.useEffect(() => {
    const stored = localStorage.getItem('savedQuotes');
    if (stored) {
      setQuotes(JSON.parse(stored));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('savedQuotes', JSON.stringify(quotes));
  }, [quotes]);

  const addQuote = (text: string, source?: string, note?: string) => {
    if (!text) return;
    const newQuote: Quote = { id: Date.now(), text, source, note };
    setQuotes(prev => [...prev, newQuote]);
  };

  const removeQuote = (id: number) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  return (
    <QuotesContext.Provider value={{ quotes, addQuote, removeQuote }}>
      {children}
    </QuotesContext.Provider>
  );
};
