
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-[#111614] border-[#29332D] text-[#F3F0E7]">
        <DialogHeader>
          <DialogTitle className="font-serif font-bold text-lg text-[#F3F0E7]">Select a Book</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col pt-1">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A5ADA6] w-4 h-4 pointer-events-none" />
            <Input
              placeholder="Search by title, author, or genre…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-[#0B0D0C] border-[#29332D] text-xs text-[#F3F0E7] placeholder:text-[#A5ADA6]/70 rounded-xl focus-visible:ring-1 focus-visible:ring-[#D5B16D]"
            />
          </div>

          {/* Books List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {isLoading ? (
              <div className="text-center py-8 text-xs text-[#A5ADA6]">Loading books…</div>
            ) : filteredBooks && filteredBooks.length > 0 ? (
              filteredBooks.slice(0, 50).map((book) => {
                const isSelected = selectedBookId === book.id;
                return (
                  <div
                    key={book.id}
                    className={`flex items-start space-x-3 p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1C3024] border border-[#315C43] shadow-xs'
                        : 'bg-[#0B0D0C]/60 hover:bg-[#16211A] border border-[#29332D]/70'
                    }`}
                    onClick={() => handleBookSelect(book)}
                    onDoubleClick={() => {
                      handleBookSelect(book);
                      onSelect({
                        id: book.id,
                        title: book.title,
                        author: book.author || 'Unknown Author',
                        cover: book.cover_image_url || '',
                        description: book.description,
                      });
                      setSelectedBookId(null);
                      setSearchQuery('');
                      onClose();
                    }}
                  >
                    {/* Book Cover */}
                    <div className="w-12 h-16 bg-[#1C3024] border border-[#315C43]/40 rounded-md flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                      {book.cover_image_url ? (
                        <img 
                          src={book.cover_image_url} 
                          alt={book.title} 
                          className="w-full h-full object-cover rounded-md" 
                        />
                      ) : (
                        <BookOpen className="w-5 h-5 text-[#D5B16D]" />
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-[#D5B16D] text-[#0B0D0C] rounded-full flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 font-bold" />
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-[#F3F0E7] line-clamp-1 mb-0.5">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-[#A5ADA6] mb-1">
                        by {book.author || 'Unknown Author'}
                      </p>
                      {book.genre && (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-[#16211A] border border-[#29332D] text-[#D5B16D] mb-1">
                          {book.genre}
                        </span>
                      )}
                      {book.description && (
                        <p className="text-[11px] text-[#A5ADA6]/80 line-clamp-2 mt-0.5">
                          {book.description.length > 120 
                            ? book.description.substring(0, 120) + '…'
                            : book.description
                          }
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-[#A5ADA6]">
                {searchQuery ? 'No books found matching your search' : 'No books available'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#29332D]">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="border-[#29332D] bg-[#111614] text-[#F3F0E7] hover:bg-[#1B241E] text-xs h-8 px-4"
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleConfirmSelection}
              disabled={!selectedBookId}
              className="bg-[#D5B16D] hover:bg-[#c49f5c] text-[#0B0D0C] font-semibold text-xs h-8 px-4 disabled:opacity-50"
            >
              Select Book
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
