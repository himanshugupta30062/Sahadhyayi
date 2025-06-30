
import React, { useMemo } from 'react';
import { Library } from 'lucide-react';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
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

  const filteredBooks = useMemo(() => {
    console.log('Filtering books with criteria:', {
      searchQuery,
      selectedGenre,
      selectedAuthor,
      selectedYear,
      selectedLanguage,
      priceRange,
      totalBooks: books.length
    });

    const filtered = books.filter(book => {
      console.log('Checking book:', book.title, 'Language:', book.language, 'Genre:', book.genre);
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          (book.genre && book.genre.toLowerCase().includes(query));
        if (!matchesSearch) {
          console.log('Book filtered out by search:', book.title);
          return false;
        }
      }

      // Genre filter - Handle Hindi specially
      if (selectedGenre !== 'All') {
        if (selectedGenre === 'Hindi') {
          if (book.language !== 'Hindi') {
            console.log('Book filtered out by Hindi language filter:', book.title, 'Language:', book.language);
            return false;
          }
        } else if (book.genre !== selectedGenre) {
          console.log('Book filtered out by genre filter:', book.title, 'Expected:', selectedGenre, 'Actual:', book.genre);
          return false;
        }
      }

      // Author filter
      if (selectedAuthor !== 'All' && book.author !== selectedAuthor) {
        console.log('Book filtered out by author filter:', book.title);
        return false;
      }

      // Year filter
      if (selectedYear && book.publication_year !== parseInt(selectedYear)) {
        console.log('Book filtered out by year filter:', book.title);
        return false;
      }

      // Language filter
      if (selectedLanguage !== 'All' && book.language !== selectedLanguage) {
        console.log('Book filtered out by language filter:', book.title);
        return false;
      }

      // Price filter
      const bookPrice = book.price || 0;
      if (bookPrice < priceRange[0] || bookPrice > priceRange[1]) {
        console.log('Book filtered out by price filter:', book.title);
        return false;
      }

      console.log('Book passed all filters:', book.title);
      return true;
    });

    console.log('Filtered books result:', filtered.length, 'books');
    console.log('Hindi books in result:', filtered.filter(book => book.language === 'Hindi').map(book => book.title));
    
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
  );
};

export default BooksCollection;
