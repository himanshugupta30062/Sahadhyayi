'use client';

import type { Book } from '@/lib/types';
import BookCard from './BookCard';

interface Props {
  books: Book[];
  loading: boolean;
}

export default function LibraryGrid({ books, loading }: Props) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        data-testid="library-grid"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="aspect-[2/3] w-full rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      data-testid="library-grid"
    >
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
