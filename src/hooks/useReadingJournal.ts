import { useMemo } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { useMarginNotes, MarginNote } from '@/hooks/useMarginNotes';
import { useReaderHighlights, ReaderHighlight } from '@/hooks/useReaderHighlights';
import { useQuotes, Quote } from '@/contexts/quotesHelpers';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { loadProgressLocally } from '@/utils/readingProgressStorage';

export type JournalEntryType = 'reflection' | 'highlight' | 'quote' | 'session';

export interface UnifiedJournalEntry {
  id: string;
  type: JournalEntryType;
  bookId: string;
  bookTitle?: string;
  page: number;
  location?: string | null;
  text: string;
  note?: string;
  color?: string;
  createdAt: string;
  rawItem: MarginNote | ReaderHighlight | Quote | Record<string, unknown>;
}

export interface BookJournalSummary {
  bookId: string;
  bookTitle: string;
  author?: string;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  reflectionCount: number;
  highlightCount: number;
  quoteCount: number;
  totalEntriesCount: number;
}

export function useReadingJournal(selectedBookId?: string) {
  const { user } = useAuth();

  // 1. Private Margin Notes
  const { data: allNotes = [], isLoading: notesLoading } = useMarginNotes(
    selectedBookId ? { bookId: selectedBookId } : undefined
  );

  // 2. Highlights
  const { data: allHighlights = [], isLoading: highlightsLoading } = useReaderHighlights(selectedBookId);

  // 3. Saved Quotes
  const { quotes: allQuotes = [] } = useQuotes();

  // 4. Reading Progress
  const { data: dbProgress = [], isLoading: progressLoading } = useReadingProgress();

  const isLoading = notesLoading || highlightsLoading || progressLoading;

  // Transform and combine entries
  const entries: UnifiedJournalEntry[] = useMemo(() => {
    const list: UnifiedJournalEntry[] = [];

    // Filter private notes belonging to user
    const userPrivateNotes = allNotes.filter(
      (n) => user && n.user_id === user.id && n.visibility === 'private' && (!selectedBookId || n.book_id === selectedBookId)
    );

    userPrivateNotes.forEach((note) => {
      list.push({
        id: `note-${note.id}`,
        type: 'reflection',
        bookId: note.book_id,
        bookTitle: note.books_library?.title,
        page: note.page || 1,
        text: note.quote || '',
        note: note.note,
        createdAt: note.created_at,
        rawItem: note,
      });
    });

    // Highlights
    allHighlights.forEach((hl) => {
      list.push({
        id: `hl-${hl.id}`,
        type: 'highlight',
        bookId: hl.book_id,
        page: hl.page || 1,
        location: hl.location,
        text: hl.text,
        color: hl.color,
        createdAt: hl.created_at,
        rawItem: hl,
      });
    });

    // Saved Quotes
    const matchingQuotes = allQuotes.filter(
      (q) => !selectedBookId || !q.bookId || q.bookId === selectedBookId
    );

    matchingQuotes.forEach((q) => {
      list.push({
        id: `quote-${q.id}`,
        type: 'quote',
        bookId: q.bookId || selectedBookId || 'general',
        bookTitle: q.source,
        page: q.page || 1,
        location: q.location,
        text: q.text,
        note: q.note,
        createdAt: new Date().toISOString(), // local quote fallback
        rawItem: q,
      });
    });

    // Sort by page ascending, then by date
    return list.sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allNotes, allHighlights, allQuotes, selectedBookId, user]);

  // Aggregate book summaries
  const bookSummaries: BookJournalSummary[] = useMemo(() => {
    const booksMap = new Map<string, BookJournalSummary>();

    // Process progress records
    dbProgress.forEach((p) => {
      if (!p.book_id) return;
      const local = loadProgressLocally(p.book_id, user?.id);
      const curr = Math.max(local?.currentPage || 0, p.current_page || 0, 1);
      const tot = Math.max(local?.totalPages || 0, p.total_pages || 0, 1);
      booksMap.set(p.book_id, {
        bookId: p.book_id,
        bookTitle: p.book_title || 'Untitled Book',
        currentPage: curr,
        totalPages: tot,
        progressPercent: tot > 1 ? Math.min(100, Math.round((curr / tot) * 100)) : 0,
        reflectionCount: 0,
        highlightCount: 0,
        quoteCount: 0,
        totalEntriesCount: 0,
      });
    });

    // Count entries
    entries.forEach((entry) => {
      const summary = booksMap.get(entry.bookId) || {
        bookId: entry.bookId,
        bookTitle: entry.bookTitle || 'Book Notes',
        currentPage: entry.page || 1,
        totalPages: 1,
        progressPercent: 0,
        reflectionCount: 0,
        highlightCount: 0,
        quoteCount: 0,
        totalEntriesCount: 0,
      };

      if (entry.type === 'reflection') summary.reflectionCount++;
      if (entry.type === 'highlight') summary.highlightCount++;
      if (entry.type === 'quote') summary.quoteCount++;
      summary.totalEntriesCount++;

      booksMap.set(entry.bookId, summary);
    });

    return Array.from(booksMap.values()).sort((a, b) => b.totalEntriesCount - a.totalEntriesCount);
  }, [dbProgress, entries, user?.id]);

  return {
    entries,
    bookSummaries,
    isLoading,
  };
}

