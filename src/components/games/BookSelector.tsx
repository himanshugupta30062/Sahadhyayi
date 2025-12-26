import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ArrowLeft, BookOpen, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Book {
  id: string;
  title: string;
  author: string | null;
  cover_image_url: string | null;
  genre: string | null;
}

interface BookSelectorProps {
  onSelect: (bookId: string) => void;
  onBack: () => void;
  loading?: boolean;
}

export default function BookSelector({ onSelect, onBack, loading }: BookSelectorProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetching, setFetching] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooks() {
      setFetching(true);
      try {
        let query = supabase
          .from('books_library')
          .select('id, title, author, cover_image_url, genre')
          .limit(50);

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setBooks(data || []);
      } catch (err) {
        console.error('Error fetching books:', err);
      } finally {
        setFetching(false);
      }
    }

    const debounce = setTimeout(fetchBooks, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelect = (bookId: string) => {
    setSelectedBookId(bookId);
    onSelect(bookId);
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Choose a Book</h1>
          <p className="text-muted-foreground">Select a book to start the quiz</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by title or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-6 text-lg"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center">
            <Gamepad2 className="h-12 w-12 mx-auto animate-bounce text-primary mb-4" />
            <p className="text-lg font-medium">Generating questions...</p>
          </div>
        </div>
      )}

      {/* Books Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fetching ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="aspect-[2/3] rounded-lg mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : books.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No books found</p>
          </div>
        ) : (
          books.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1',
                  selectedBookId === book.id && 'ring-2 ring-primary'
                )}
                onClick={() => handleSelect(book.id)}
              >
                <CardContent className="p-3">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <BookOpen className="h-8 w-8 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">{book.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {book.author || 'Unknown Author'}
                  </p>
                  {book.genre && (
                    <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {book.genre}
                    </span>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
