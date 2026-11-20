import React, { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Loader2, Check, Sparkles } from 'lucide-react';
import { useBookSearch, type BookSearchResult } from '@/hooks/useBookSearch';

interface CreatorBookPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBook: (book: BookSearchResult) => void;
  currentBookId?: string;
}

export const CreatorBookPicker: React.FC<CreatorBookPickerProps> = ({
  open,
  onOpenChange,
  onSelectBook,
  currentBookId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { searchBooks, loading, searchResults } = useBookSearch();
  const [, startTransition] = useTransition();

  // Debounced search on typing
  useEffect(() => {
    if (!open) return;
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        void searchBooks(trimmed);
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, open, searchBooks]);

  const handleSelect = (book: BookSearchResult) => {
    onSelectBook(book);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="w-5 h-5 text-amber-500" />
            Select Book for Your Post
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Search Sahadhyayi's library by title, author, or ISBN to auto-populate your design.
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search book title or author..."
            className="pl-9 pr-8 h-10 text-sm"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Results / List */}
        <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[380px] divide-y divide-border/50 -mx-2 px-2 mt-2">
          {searchResults && searchResults.length > 0 ? (
            searchResults.map((book) => {
              const isSelected = currentBookId === book.id;
              return (
                <div
                  key={book.id}
                  onClick={() => handleSelect(book)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(book);
                    }
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer hover:bg-accent/60 ${
                    isSelected ? 'bg-accent/80 ring-1 ring-amber-500/30' : ''
                  }`}
                >
                  {/* Book Cover */}
                  <div className="w-11 h-16 rounded overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center shadow-sm">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <BookOpen className="w-5 h-5 opacity-40" />
                    )}
                  </div>

                  {/* Book Metadata */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate leading-snug">
                      {book.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {book.author || 'Unknown Author'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {book.genre && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {book.genre}
                        </Badge>
                      )}
                      {book.publication_year && (
                        <span className="text-[10px] text-muted-foreground">
                          {book.publication_year}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selected check */}
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })
          ) : searchTerm.trim() ? (
            !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <BookOpen className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-sm font-medium">No books found for &ldquo;{searchTerm}&rdquo;</p>
                <p className="text-xs opacity-75 mt-0.5">Try searching by author name or a different keyword.</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Sparkles className="w-8 h-8 text-amber-500/50 mb-2" />
              <p className="text-sm font-medium">Type a title or author above</p>
              <p className="text-xs opacity-75 max-w-xs mt-1">
                Sahadhyayi links your design to authentic catalog records so author, cover, and details are accurate.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t mt-auto">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
