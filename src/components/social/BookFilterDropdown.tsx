
import React, { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';

interface BookOption {
  id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
}

interface BookFilterDropdownProps {
  selectedBookId: string | null;
  onBookSelect: (book: BookOption | null) => void;
}

export const BookFilterDropdown: React.FC<BookFilterDropdownProps> = ({
  selectedBookId,
  onBookSelect,
}) => {
  const [open, setOpen] = useState(false);
  const { data: bookshelf = [] } = useUserBookshelf();

  // Extract unique books from bookshelf
  const books: BookOption[] = bookshelf
    .filter(item => item.books_library)
    .map(item => ({
      id: item.books_library!.id,
      title: item.books_library!.title,
      author: item.books_library!.author,
      cover_image_url: item.books_library!.cover_image_url,
    }))
    .filter((book, index, self) => 
      index === self.findIndex(b => b.id === book.id)
    );

  const selectedBook = books.find(book => book.id === selectedBookId);

  return (
    <div className="w-full max-w-md">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white border-gray-200 hover:bg-gray-50"
          >
            {selectedBook ? (
              <div className="flex items-center gap-2 truncate">
                {selectedBook.cover_image_url && (
                  <img 
                    src={selectedBook.cover_image_url} 
                    alt="" 
                    className="w-5 h-5 rounded object-cover"
                  />
                )}
                <span className="truncate">
                  {selectedBook.title}
                  {selectedBook.author && (
                    <span className="text-gray-500 ml-1">by {selectedBook.author}</span>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-gray-500">Select a book to view readers on map</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg">
          <Command>
            <CommandInput 
              placeholder="Search books..." 
              className="border-0 focus:ring-0"
            />
            <CommandEmpty>No books found in your bookshelf.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              <CommandItem
                key="clear"
                onSelect={() => {
                  onBookSelect(null);
                  setOpen(false);
                }}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
              >
                <div className="w-5 h-5" />
                <span className="text-gray-500">Clear selection</span>
                {!selectedBookId && <Check className="ml-auto h-4 w-4" />}
              </CommandItem>
              {books.map((book) => (
                <CommandItem
                  key={book.id}
                  onSelect={() => {
                    onBookSelect(book);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {book.cover_image_url ? (
                    <img 
                      src={book.cover_image_url} 
                      alt="" 
                      className="w-5 h-5 rounded object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-orange-200 rounded flex items-center justify-center">
                      <span className="text-xs text-orange-700">📚</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{book.title}</div>
                    {book.author && (
                      <div className="text-sm text-gray-500 truncate">by {book.author}</div>
                    )}
                  </div>
                  {selectedBookId === book.id && (
                    <Check className="ml-auto h-4 w-4 text-orange-600" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
