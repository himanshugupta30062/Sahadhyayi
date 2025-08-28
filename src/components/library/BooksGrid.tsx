
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import type { Book } from '@/hooks/useLibraryBooks';
import BookCard from './BookCard';

interface BooksGridProps {
  books: Book[];
  onDownloadPDF?: (book: Book) => void;
}

const BooksGrid = ({ books, onDownloadPDF }: BooksGridProps) => {
  // Sort books based on availability of cover_url and pdf_url
  const sortedBooks = useMemo(() => {
    if (!Array.isArray(books)) {
      console.error('Books is not an array:', books);
      return [];
    }

    return [...books].sort((a, b) => {
      const aHasBoth = !!(a.cover_image_url && a.pdf_url);
      const bHasBoth = !!(b.cover_image_url && b.pdf_url);
      
      const aHasPdf = !!a.pdf_url;
      const bHasPdf = !!b.pdf_url;
      
      const aHasCover = !!a.cover_image_url;
      const bHasCover = !!b.cover_image_url;

      // Priority 1: Both cover and PDF
      if (aHasBoth && !bHasBoth) return -1;
      if (!aHasBoth && bHasBoth) return 1;
      if (aHasBoth && bHasBoth) return 0;

      // Priority 2: PDF only (no cover)
      if (aHasPdf && !aHasCover && !(bHasPdf && !bHasCover)) return -1;
      if (!(aHasPdf && !aHasCover) && (bHasPdf && !bHasCover)) return 1;
      if ((aHasPdf && !aHasCover) && (bHasPdf && !bHasCover)) return 0;

      // Priority 3: Cover only (no PDF)
      if (aHasCover && !aHasPdf && !(bHasCover && !bHasPdf)) return -1;
      if (!(aHasCover && !aHasPdf) && (bHasCover && !bHasPdf)) return 1;

      return 0;
    });
  }, [books]);

  if (sortedBooks.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Books Found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or filters to find more books.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="library-grid">
      {sortedBooks.map((book) => (
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
