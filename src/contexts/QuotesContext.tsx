import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client';
import { mergeQuotes, QuotesContext, type Quote } from './quotesHelpers';

const getStorageKey = (userId?: string) => `savedQuotes:${userId ?? 'guest'}`;
const isUuid = (value?: string) => Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
type CloudQuote = { client_id: string; quote_text: string; source: string | null; note: string | null; book_id: string | null; page: number | null; location: string | null; created_at: string };

const toCloud = (quote: Quote, userId: string): CloudQuote & { user_id: string } => ({
  client_id: String(quote.id), user_id: userId, quote_text: quote.text,
  source: quote.source ?? null, note: quote.note ?? null,
  book_id: isUuid(quote.bookId) ? quote.bookId! : null,
  page: quote.page ?? null, location: quote.location ?? null,
  created_at: quote.createdAt ?? new Date().toISOString(),
});

const fromCloud = (row: CloudQuote): Quote => ({
  id: row.client_id, text: row.quote_text, source: row.source ?? undefined,
  note: row.note ?? undefined, bookId: row.book_id ?? undefined,
  page: row.page ?? undefined, location: row.location ?? undefined, createdAt: row.created_at,
});

const QuotesProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const storageKey = getStorageKey(user?.id);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);

  useEffect(() => {
    setLoadedStorageKey(null);
    try {
      const stored = window.localStorage.getItem(storageKey);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      setQuotes(Array.isArray(parsed) ? parsed as Quote[] : []);
    } catch {
      setQuotes([]);
    } finally {
      setLoadedStorageKey(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(quotes)); } catch { /* in-memory fallback */ }
  }, [quotes, storageKey, loadedStorageKey]);

  // Signed-in readers get a cloud backup and cross-device merge. Local quotes are
  // uploaded first (upsert by stable client_id), then the merged cloud collection
  // becomes the canonical in-memory list. Guests remain local-only.
  useEffect(() => {
    if (!user?.id || loadedStorageKey !== storageKey) return;
    let cancelled = false;
    const sync = async () => {
      const local = quotes;
      const pending = local.map(q => toCloud(q, user.id));
      if (pending.length) {
        const { error: uploadError } = await supabase.from('saved_quotes').upsert(pending, { onConflict: 'user_id,client_id' });
        if (uploadError) return; // local data remains safe; retry on next change/session
      }
      const { data, error } = await supabase.from('saved_quotes')
        .select('client_id,quote_text,source,note,book_id,page,location,created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false });
      if (error || !data || cancelled) return;
      const cloud = (data as unknown as CloudQuote[]).map(fromCloud);
      const merged = mergeQuotes(cloud, local);
      if (!cancelled) setQuotes(previous => JSON.stringify(previous) === JSON.stringify(merged) ? previous : merged);
    };
    void sync();
    return () => { cancelled = true; };
  // quotes changes trigger sync so newly added quotes are uploaded.
  }, [user?.id, loadedStorageKey, storageKey, quotes]);

  const addQuote = (text: string, source?: string, note?: string, metadata?: { bookId?: string; page?: number; location?: string }) => {
    if (!text.trim() || loadedStorageKey !== storageKey) return;
    const newQuote: Quote = { id: globalThis.crypto?.randomUUID?.() ?? Date.now(), text: text.trim(), source, note, ...metadata, createdAt: new Date().toISOString() };
    setQuotes(prev => [...prev, newQuote]);
  };

  const removeQuote = (id: number | string) => {
    if (loadedStorageKey !== storageKey) return;
    setQuotes(prev => prev.filter(q => String(q.id) !== String(id)));
    if (user?.id) {
      void supabase.from('saved_quotes').delete().eq('user_id', user.id).eq('client_id', String(id));
    }
  };

  return <QuotesContext.Provider value={{ quotes, addQuote, removeQuote }}>{children}</QuotesContext.Provider>;
};

export default QuotesProvider;
