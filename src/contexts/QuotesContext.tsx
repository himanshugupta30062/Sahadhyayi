import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { QuotesContext, type Quote } from './quotesHelpers';

const getStorageKey = (userId?: string) => `savedQuotes:${userId ?? 'guest'}`;

const QuotesProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const storageKey = getStorageKey(user?.id);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);

  // Keep personal quote collections separate for guests and every signed-in account.
  useEffect(() => {
    setLoadedStorageKey(null);
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        setQuotes([]);
      } else {
        const parsed: unknown = JSON.parse(stored);
        setQuotes(Array.isArray(parsed) ? parsed as Quote[] : []);
      }
    } catch {
      setQuotes([]);
    } finally {
      setLoadedStorageKey(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    // Never persist the previous account's in-memory quotes under a new account key.
    if (loadedStorageKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(quotes));
    } catch {
      // Quotes remain usable in memory when persistence is unavailable.
    }
  }, [quotes, storageKey, loadedStorageKey]);

  const addQuote = (text: string, source?: string, note?: string, metadata?: { bookId?: string; page?: number; location?: string }) => {
    if (!text.trim() || loadedStorageKey !== storageKey) return;
    const newQuote: Quote = { id: Date.now(), text: text.trim(), source, note, ...metadata };
    setQuotes(prev => [...prev, newQuote]);
  };

  const removeQuote = (id: number) => {
    if (loadedStorageKey !== storageKey) return;
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  return (
    <QuotesContext.Provider value={{ quotes, addQuote, removeQuote }}>
      {children}
    </QuotesContext.Provider>
  );
};

export default QuotesProvider;
