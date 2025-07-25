import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
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

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No books found matching your criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/90 backdrop-blur-sm border-gray-200">
            {/* Book Cover */}
            <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg relative group cursor-pointer"
                 onClick={() => handleViewBook(book)}>
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={`Book cover of "${book.title}" by ${book.author || 'Unknown Author'} - Click to view details`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              
              {/* Fallback placeholder */}
              <div className={`text-center p-4 ${book.cover_image_url ? 'hidden' : ''}`}>
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-80" />
                <div className="text-sm leading-tight">
                  {book.title.length > 30 ? book.title.substring(0, 30) + '...' : book.title}
                </div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Eye className="w-8 h-8 text-white" />
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Title */}
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors"
                  onClick={() => handleViewBook(book)}>
                {book.title}
              </h3>

              {/* Author */}
              {book.author && (
                <p className="text-gray-600 text-sm">
                  by <Link to={`/authors/${slugify(book.author)}`}>{book.author}</Link>
                </p>
              )}

              {/* Genre, Year, and Language */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-wrap gap-1">
                  {book.genre && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      {book.genre}
                    </span>
                  )}
                  {book.language && book.language !== 'English' && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                      {book.language}
                    </span>
                  )}
                </div>
                {book.publication_year && (
                  <span className="text-gray-500 font-medium">{book.publication_year}</span>
                )}
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 space-y-2">
              {/* Download PDF Button */}
              <Button
                size="sm"
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                onClick={() => handleDownloadPDF(book)}
                disabled={!book.pdf_url}
                aria-label={`Download PDF of ${book.title}`}
              >
                <Download className="w-4 h-4 mr-1" />
                Download PDF
              </Button>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full">
                <Link to={`/books/${book.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                </Link>
              </div>

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
