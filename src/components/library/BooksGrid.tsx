
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import type { Book } from '@/hooks/useLibraryBooks';
import BookCard from './BookCard';

interface BooksGridProps {
  books: Book[];
  onDownloadPDF?: (book: Book) => void;
}

const BooksGrid = ({ books, onDownloadPDF }: BooksGridProps) => {
  // Books are already sorted by completeness score from usePaginatedLibraryBooks
  // Do NOT re-sort here — it would break the carefully curated order

  if (!Array.isArray(books) || books.length === 0) {
    return (
      <Card className="bg-card border-border shadow-lg">
        <CardContent className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-card-foreground mb-2">No Books Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or filters to find more books.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="books-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onDownloadPDF={onDownloadPDF || (() => {})}
        />
      ))}
    </div>
  );
};

export default BooksGrid;
