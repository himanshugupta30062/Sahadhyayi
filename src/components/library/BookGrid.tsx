
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BookCard from './BookCard';
import { BookOpen } from 'lucide-react';
import { useBooksByGenre, useGenres } from '@/hooks/useLibraryBooks';
import type { Book, Genre } from '@/hooks/useLibraryBooks';

const BookGrid = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const { data: books = [], isLoading: booksLoading } = useBooksByGenre(selectedGenre);
  const { data: genres = [], isLoading: genresLoading } = useGenres();

  const validBooks = books.filter((book: Book) =>
    Boolean(book.title) && Boolean((book as any).coverUrl || book.cover_image_url)
  );

  const handleDownloadPDF = (book: Book) => {
    if (book.pdf_url) {
      const link = document.createElement('a');
      link.href = book.pdf_url;
      link.download = `${book.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('PDF not available for this book');
    }
  };

  if (booksLoading || genresLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        {validBooks.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Genre Filter */}
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="genre-select" className="text-sm font-medium">
          Filter by Genre:
        </label>
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Genres</SelectItem>
            {genres.map((genre: Genre) => (
              <SelectItem key={genre.id} value={genre.name}>
                {genre.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Books Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {validBooks.map((book: Book) => (
          <BookCard key={book.id} book={book} onDownloadPDF={handleDownloadPDF} />
        ))}
      </div>

      {validBooks.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-500">
            {selectedGenre === 'All'
              ? 'No books are available in the library yet.'
              : `No books found in the ${selectedGenre} genre.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default BookGrid;
