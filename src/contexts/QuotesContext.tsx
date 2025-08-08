
import React, { useEffect, useState } from 'react';
import { QuotesContext, type Quote } from './quotesHelpers';

const QuotesProvider = ({ children }: { children: React.ReactNode }) => {

  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('savedQuotes');
    if (stored) {
      setQuotes(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
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

export default QuotesProvider;
