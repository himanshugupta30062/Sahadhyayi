
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen } from 'lucide-react';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url?: string;
}

interface BookSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (book: { id: string; title: string; author: string; cover: string }) => void;
}

export const BookSelectionModal = ({ isOpen, onClose, onSelect }: BookSelectionModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: books, isLoading } = useLibraryBooks(searchQuery);

  const handleBookSelect = (book: Book) => {
    onSelect({
      id: book.id,
      title: book.title,
      author: book.author || 'Unknown Author',
      cover: book.cover_image_url || ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Book</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading books...</div>
            ) : books && books.length > 0 ? (
              books.slice(0, 20).map((book) => (
                <div
                  key={book.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => handleBookSelect(book)}
                >
                  <div className="w-10 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded flex-shrink-0 flex items-center justify-center">
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover rounded" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{book.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{book.author || 'Unknown Author'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No books found' : 'Start typing to search books'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
