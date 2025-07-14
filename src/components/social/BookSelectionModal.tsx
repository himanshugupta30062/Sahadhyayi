
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Check } from 'lucide-react';
import { useAllLibraryBooks } from '@/hooks/useLibraryBooks';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url?: string;
  description?: string;
  genre?: string;
}

interface BookSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (book: { id: string; title: string; author: string; cover: string; description?: string }) => void;
}

export const BookSelectionModal = ({ isOpen, onClose, onSelect }: BookSelectionModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const { data: books, isLoading } = useAllLibraryBooks();

  // Filter books based on search query
  const filteredBooks = books?.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleBookSelect = (book: Book) => {
    setSelectedBookId(book.id);
  };

  const handleConfirmSelection = () => {
    const selectedBook = filteredBooks.find(book => book.id === selectedBookId);
    if (selectedBook) {
      onSelect({
        id: selectedBook.id,
        title: selectedBook.title,
        author: selectedBook.author || 'Unknown Author',
        cover: selectedBook.cover_image_url || '',
        description: selectedBook.description
      });
      setSelectedBookId(null);
      setSearchQuery('');
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedBookId(null);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Book</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by title, author, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Books List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading books...</div>
            ) : filteredBooks && filteredBooks.length > 0 ? (
              filteredBooks.slice(0, 50).map((book) => (
                <div
                  key={book.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                    selectedBookId === book.id 
                      ? 'bg-orange-50 border-2 border-orange-300' 
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                  onClick={() => handleBookSelect(book)}
                >
                  {/* Book Cover */}
                  <div className="w-12 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded flex-shrink-0 flex items-center justify-center relative">
                    {book.cover_image_url ? (
                      <img 
                        src={book.cover_image_url} 
                        alt={book.title} 
                        className="w-full h-full object-cover rounded" 
                      />
                    ) : (
                      <BookOpen className="w-6 h-6 text-white" />
                    )}
                    {selectedBookId === book.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                      {book.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-1">
                      by {book.author || 'Unknown Author'}
                    </p>
                    {book.genre && (
                      <p className="text-xs text-gray-500 mb-2">
                        Genre: {book.genre}
                      </p>
                    )}
                    {book.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {book.description.length > 100 
                          ? book.description.substring(0, 100) + '...'
                          : book.description
                        }
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No books found matching your search' : 'No books available'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSelection}
              disabled={!selectedBookId}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Select Book
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
