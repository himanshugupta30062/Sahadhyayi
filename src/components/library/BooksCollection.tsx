
import React, { useMemo } from 'react';
import { Library } from 'lucide-react';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import InternetArchiveReader from './InternetArchiveReader';
import type { Book } from '@/hooks/useLibraryBooks';
import BooksGrid from './BooksGrid';
import LoadingGrid from './LoadingGrid';

interface BooksCollectionProps {
  searchQuery: string;
  selectedGenre: string;
  selectedAuthor: string;
  selectedYear: string;
  selectedLanguage: string;
  priceRange: [number, number];
}

const BooksCollection = ({
  searchQuery,
  selectedGenre,
  selectedAuthor,
  selectedYear,
  selectedLanguage,
  priceRange
}: BooksCollectionProps) => {
  const { data: books = [], isLoading } = useLibraryBooks();
  const [isReaderOpen, setIsReaderOpen] = React.useState(false);
  const [readerBook, setReaderBook] = React.useState<Book | null>(null);

  const filteredBooks = useMemo(() => {
    const filtered = books.filter(book => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          (book.genre && book.genre.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Genre filter
      if (selectedGenre !== 'All' && book.genre !== selectedGenre) return false;

      // Author filter
      if (selectedAuthor !== 'All' && book.author !== selectedAuthor) return false;

      // Year filter
      if (selectedYear && book.publication_year !== parseInt(selectedYear)) return false;

      // Language filter
      if (selectedLanguage !== 'All' && book.language !== selectedLanguage) return false;

      // Price filter
      const bookPrice = book.price || 0;
      if (bookPrice < priceRange[0] || bookPrice > priceRange[1]) return false;

      return true;
    });

    return filtered;
  }, [books, searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange]);

  const handleDownloadPDF = async (book: Book) => {
    if (!book.pdf_url) {
      alert('PDF not available for this book');
      return;
    }

    try {
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = book.pdf_url;
      link.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingGrid />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
            <Library className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Books Collection
          </h2>
          {filteredBooks.length > 0 && (
            <span className="text-sm text-gray-500 bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
              {filteredBooks.length} books found
            </span>
          )}
        </div>

        {/* Books Grid */}
        <BooksGrid books={filteredBooks} onDownloadPDF={handleDownloadPDF} />
      </div>

      {/* Internet Archive Book Reader */}
      <InternetArchiveReader
        book={readerBook}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
      />
    </>
  );
};

export default BooksCollection;
