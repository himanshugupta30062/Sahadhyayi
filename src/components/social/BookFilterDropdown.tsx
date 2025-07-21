import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown } from 'lucide-react';
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
  const { data: bookshelfData } = useUserBookshelf();

  // Extract unique books from bookshelf
  const books: BookOption[] = bookshelfData?.reduce((acc: BookOption[], item: any) => {
    if (item.books_library) {
      const existingBook = acc.find(book => book.id === item.books_library.id);
      if (!existingBook) {
        acc.push({
          id: item.books_library.id,
          title: item.books_library.title,
          author: item.books_library.author,
          cover_image_url: item.books_library.cover_image_url,
        });
      }
    }
    return acc;
  }, []) || [];

  const selectedBook = books.find(book => book.id === selectedBookId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background"
        >
          {selectedBook ? (
            <div className="flex items-center gap-2">
              {selectedBook.cover_image_url && (
                <img 
                  src={selectedBook.cover_image_url} 
                  alt={selectedBook.title}
                  className="w-6 h-8 object-cover rounded"
                />
              )}
              <div className="text-left">
                <div className="font-medium">{selectedBook.title}</div>
                {selectedBook.author && (
                  <div className="text-sm text-muted-foreground">{selectedBook.author}</div>
                )}
              </div>
            </div>
          ) : (
            "Select a book to view readers..."
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-background border shadow-lg z-50" align="start">
        <Command className="bg-background">
          <CommandInput placeholder="Search books..." className="bg-background" />
          <CommandList className="bg-background">
            <CommandEmpty>No books found.</CommandEmpty>
            <CommandGroup className="bg-background">
              <CommandItem
                value=""
                onSelect={() => {
                  onBookSelect(null);
                  setOpen(false);
                }}
                className="bg-background hover:bg-accent"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !selectedBookId ? "opacity-100" : "opacity-0"
                  )}
                />
                Clear selection
              </CommandItem>
              {books.map((book) => (
                <CommandItem
                  key={book.id}
                  value={book.title}
                  onSelect={() => {
                    onBookSelect(book);
                    setOpen(false);
                  }}
                  className="bg-background hover:bg-accent"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedBookId === book.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    {book.cover_image_url && (
                      <img 
                        src={book.cover_image_url} 
                        alt={book.title}
                        className="w-6 h-8 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium">{book.title}</div>
                      {book.author && (
                        <div className="text-sm text-muted-foreground">{book.author}</div>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};