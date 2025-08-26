'use client';

import { useEffect, useState } from 'react';
import LibraryGrid from '@/components/library/LibraryGrid';
import SearchAndFilters, { FilterState } from '@/components/library/SearchAndFilters';
import Paginator from '@/components/library/Paginator';
import { getBooks } from '@/lib/supabase/books';
import type { Book } from '@/lib/types';
import useDebouncedValue from '@/lib/useDebouncedValue';

export const dynamic = 'force-dynamic';

const defaultFilters: FilterState = {
  genres: [],
  language: undefined,
  price: undefined,
  yearRange: [undefined, undefined],
  sort: 'newest',
};

export default function LibraryPage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<string[]>([]);

  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getBooks(
      {
        q: debouncedQuery || undefined,
        genres: filters.genres,
        language: filters.language,
        price: filters.price,
        yearRange: filters.yearRange,
        sort: filters.sort,
        cursor,
      },
      controller.signal,
    )
      .then((res) => {
        setBooks(res.items);
        setNextCursor(res.nextCursor);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Something went wrong while loading books.');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery, filters, cursor]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setCursor(undefined);
    setHistory([]);
  };

  const handleFiltersChange = (f: FilterState) => {
    setFilters(f);
    setCursor(undefined);
    setHistory([]);
  };

  const handleNext = () => {
    if (nextCursor) {
      setHistory((h) => [...h, cursor ?? '']);
      setCursor(nextCursor);
    }
  };

  const handlePrev = () => {
    setHistory((h) => {
      const newHist = [...h];
      const prev = newHist.pop();
      setCursor(prev || undefined);
      return newHist;
    });
  };

  return (
    <div className="space-y-6 p-4">
      <SearchAndFilters
        query={query}
        onQueryChange={handleQueryChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
      {error && <p className="text-red-600">{error}</p>}
      <LibraryGrid books={books} loading={loading} />
      {!loading && !error && books.length === 0 && (
        <div className="text-center">
          <p>No results found.</p>
          <a className="text-blue-600 underline" href="/ultimate-book-finder">
            Try the Ultimate Book Finder
          </a>
        </div>
      )}
      <Paginator
        hasPrev={history.length > 0}
        hasNext={!!nextCursor}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
