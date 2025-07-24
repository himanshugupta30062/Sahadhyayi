import React, { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import BookCard from './BookCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Book } from '@/hooks/useLibraryBooks';

interface VirtualizedBooksGridProps {
  books: Book[];
  fetchMore: () => void;
  hasMore: boolean;
  isFetching: boolean;
  onDownloadPDF: (book: Book) => void;
}

const ROW_HEIGHT = 340; // approximate height of a row of cards
const COLUMNS = 4;

const VirtualizedBooksGrid: React.FC<VirtualizedBooksGridProps> = ({
  books,
  fetchMore,
  hasMore,
  isFetching,
  onDownloadPDF,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(books.length / COLUMNS);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  useEffect(() => {
    const virtualRows = rowVirtualizer.getVirtualItems();
    if (!virtualRows.length) return;
    const last = virtualRows[virtualRows.length - 1];
    if (last.index >= rowCount - 1 && hasMore && !isFetching) {
      fetchMore();
    }
  }, [rowVirtualizer.getVirtualItems(), rowCount, hasMore, isFetching, fetchMore]);

  return (
    <div ref={parentRef} className="h-[80vh] overflow-auto">
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * COLUMNS;
          const items = books.slice(startIndex, startIndex + COLUMNS);
          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 right-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {items.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDownloadPDF={onDownloadPDF}
                />
              ))}
            </div>
          );
        })}
      </div>
      {isFetching && (
        <div className="py-4 flex justify-center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default VirtualizedBooksGrid;
