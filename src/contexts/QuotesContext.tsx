import React, { useEffect, useState } from 'react';
import { QuotesContext, type Quote } from './quotesHelpers';

const QuotesProvider = ({ children }: { children: React.ReactNode }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('savedQuotes');
      if (!stored) return;

      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setQuotes(parsed as Quote[]);
      }
    } catch {
      // Ignore unavailable storage or malformed persisted data.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('savedQuotes', JSON.stringify(quotes));
    } catch {
      // Quotes remain usable in memory when persistence is unavailable.
    }
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

export default QuotesProvider;
