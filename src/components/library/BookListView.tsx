import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import BookReader from './BookReader';
import type { Book } from '@/hooks/useLibraryBooks';

interface BookListViewProps {
  books: Book[];
}

const BookListView = ({ books }: BookListViewProps) => {
  const [userShelves, setUserShelves] = useState<Record<string, string>>({});
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [readerBook, setReaderBook] = useState<Book | null>(null);


  const handleShelfChange = (bookId: string, shelf: string) => {
    setUserShelves(prev => ({ ...prev, [bookId]: shelf }));
  };

  const handleReadBook = (book: Book) => {
    setReaderBook(book);
    setIsReaderOpen(true);
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
      <div className="space-y-4">
        {books.map((book) => (
          <div key={book.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex gap-6">
              {/* Book Cover */}
              <div className="w-20 h-28 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="text-center p-1">
                    <div className="text-xs">{book.title.slice(0, 10)}...</div>
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-xl text-gray-900 hover:text-orange-600 cursor-pointer">
                    {book.title}
                  </h3>
                </div>

                {/* Genre and Year */}
                {book.genre && (
                  <div className="flex items-center gap-2">
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {book.genre}
                    </span>
                    {book.publication_year && (
                      <span className="text-xs text-gray-500">{book.publication_year}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 w-48 space-y-3">
                
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Book Reader */}
      <BookReader
        book={readerBook}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
      />
    </>
  );
};

export default BookListView;
