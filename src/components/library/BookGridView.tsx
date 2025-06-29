
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, StarHalf, ExternalLink, Eye, BookOpen, Download } from 'lucide-react';
import BookDetailModal from './BookDetailModal';
import BookReader from './BookReader';
import type { Book } from '@/hooks/useLibraryBooks';

interface BookGridViewProps {
  books: Book[];
}

const BookGridView = ({ books }: BookGridViewProps) => {
  const [userShelves, setUserShelves] = useState<Record<string, string>>({});
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [readerBook, setReaderBook] = useState<Book | null>(null);

  const handleDownloadPDF = async (book: Book) => {
    if (!book.pdf_url) {
      alert('PDF not available for this book');
      return;
    }

    try {
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

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  const handleShelfChange = (bookId: string, shelf: string) => {
    setUserShelves(prev => ({ ...prev, [bookId]: shelf }));
  };

  const handleViewBook = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleReadBook = (book: Book) => {
    setReaderBook(book);
    setIsReaderOpen(true);
  };

  const getPrimaryPurchaseUrl = (book: Book) => {
    return book.amazon_url || book.google_books_url || book.internet_archive_url;
  };

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No books found matching your criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            {/* Book Cover */}
            <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg relative group cursor-pointer"
                 onClick={() => handleViewBook(book)}>
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              
              {/* Fallback placeholder */}
              <div className={`text-center p-4 ${book.cover_image_url ? 'hidden' : ''}`}>
                <div className="text-sm">{book.title}</div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Eye className="w-8 h-8 text-white" />
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Title */}
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 hover:text-orange-600 cursor-pointer"
                  onClick={() => handleViewBook(book)}>
                {book.title}
              </h3>

              {/* Author */}
              <p className="text-gray-600 text-sm">{book.author}</p>

              {/* Genre and Year */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                {book.genre && <span className="bg-gray-100 px-2 py-1 rounded">{book.genre}</span>}
                {book.publication_year && <span>{book.publication_year}</span>}
              </div>

              {/* Rating and Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {renderStars(book.rating || 0)}
                  <span className="text-sm font-medium ml-1">{(book.rating || 0).toFixed(1)}</span>
                </div>
                {book.price && (
                  <span className="text-lg font-bold text-green-600">${book.price}</span>
                )}
              </div>

              {/* Description Preview */}
              {book.description && (
                <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                  {book.description}
                </p>
              )}
            </CardContent>

            <CardFooter className="p-4 pt-0 space-y-2">
              {/* Action Buttons */}
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReadBook(book)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  Read Now
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewBook(book)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Details
                </Button>
              </div>

              {/* Download PDF Button */}
              {book.pdf_url && (
                <Button
                  size="sm"
                  onClick={() => handleDownloadPDF(book)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download PDF
                </Button>
              )}

              {/* External Link */}
              {getPrimaryPurchaseUrl(book) && (
                <Button
                  size="sm"
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <a href={getPrimaryPurchaseUrl(book)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {book.amazon_url ? 'Buy on Amazon' : 'View External'}
                  </a>
                </Button>
              )}

              {/* Shelf Selector */}
              <Select
                value={userShelves[book.id] || 'want-to-read'}
                onValueChange={(value) => handleShelfChange(book.id, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want-to-read">Want to Read</SelectItem>
                  <SelectItem value="currently-reading">Currently Reading</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="did-not-finish">Did Not Finish</SelectItem>
                </SelectContent>
              </Select>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Book Reader */}
      <BookReader
        book={readerBook}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
      />
    </>
  );
};

export default BookGridView;
