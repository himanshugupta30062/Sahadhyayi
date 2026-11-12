import React, { useEffect, useRef, useState } from 'react';
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
  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const [syncAttempt, setSyncAttempt] = useState(0);
  const deletedQuoteIds = useRef(new Set<string>());
  const syncGeneration = useRef(0);

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
    if (!user?.id || loadedStorageKey !== storageKey) { setSyncStatus('local'); return; }
    setSyncStatus('syncing');
    let cancelled = false;
    const generation = ++syncGeneration.current;
    const sync = async () => {
      const local = quotes.filter(q => !deletedQuoteIds.current.has(String(q.id)));
      const pending = local.map(q => toCloud(q, user.id));
      if (pending.length) {
        const { error: uploadError } = await supabase.from('saved_quotes').upsert(pending, { onConflict: 'user_id,client_id' });
        if (uploadError) { if (!cancelled && generation === syncGeneration.current) setSyncStatus('error'); return; }
        // A deletion can race with an upload that was already in flight. Re-apply
        // tombstones after upsert so that stale pending rows cannot be resurrected.
        const deletedIds = [...deletedQuoteIds.current];
        if (deletedIds.length) {
          const { error: cleanupError } = await supabase.from('saved_quotes').delete()
            .eq('user_id', user.id).in('client_id', deletedIds);
          if (cleanupError) { if (!cancelled && generation === syncGeneration.current) setSyncStatus('error'); return; }
        }
      }
      const { data, error } = await supabase.from('saved_quotes')
        .select('client_id,quote_text,source,note,book_id,page,location,created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false });
      if (error || !data || cancelled || generation !== syncGeneration.current) { if (!cancelled && generation === syncGeneration.current) setSyncStatus('error'); return; }
      const cloud = (data as unknown as CloudQuote[]).map(fromCloud).filter(q => !deletedQuoteIds.current.has(String(q.id)));
      const cloudIds = new Set(cloud.map(q => String(q.id)));
      const merged = mergeQuotes(cloud, local).filter(q => !deletedQuoteIds.current.has(String(q.id)));
      if (!cancelled && generation === syncGeneration.current) { setQuotes(previous => JSON.stringify(previous) === JSON.stringify(merged) ? previous : merged); setSyncStatus('synced'); }
    };
    void sync();
    return () => { cancelled = true; };
  // quotes changes trigger sync so newly added quotes are uploaded.
  }, [user?.id, loadedStorageKey, storageKey, quotes, syncAttempt]);

  const addQuote = (text: string, source?: string, note?: string, metadata?: { bookId?: string; page?: number; location?: string }) => {
    if (!text.trim() || loadedStorageKey !== storageKey) return;
    const newQuote: Quote = { id: globalThis.crypto?.randomUUID?.() ?? Date.now(), text: text.trim(), source, note, ...metadata, createdAt: new Date().toISOString() };
    setQuotes(prev => [...prev, newQuote]);
  };

  const removeQuote = (id: number | string) => {
    if (loadedStorageKey !== storageKey) return;
    const removed = quotes.find(q => String(q.id) === String(id));
    deletedQuoteIds.current.add(String(id));
    ++syncGeneration.current;
    setQuotes(prev => prev.filter(q => String(q.id) !== String(id)));
    if (user?.id) {
      void supabase.from('saved_quotes').delete().eq('user_id', user.id).eq('client_id', String(id))
        .then(({ error }) => {
          // A failed cloud delete must not silently lose the user's quote locally.
          if (error && removed) {
            deletedQuoteIds.current.delete(String(id));
            setSyncStatus('error');
            setQuotes(prev => prev.some(q => String(q.id) === String(id)) ? prev : [...prev, removed]);
          }
        });
    }
  };

  const retrySync = () => setSyncAttempt(attempt => attempt + 1);

  return <QuotesContext.Provider value={{ quotes, addQuote, removeQuote, syncStatus, retrySync }}>{children}</QuotesContext.Provider>;
};

export default QuotesProvider;
