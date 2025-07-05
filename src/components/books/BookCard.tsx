
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAddToBookshelf, useUserBookshelf } from '@/hooks/useUserBookshelf';

interface Book {
  id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
  description?: string;
}

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const { user } = useAuth();
  const { data: bookshelf = [] } = useUserBookshelf();
  const addToBookshelf = useAddToBookshelf();

  const isInShelf = bookshelf.some(item => item.book_id === book.id);

  const handleAddToShelf = () => {
    if (!user) return;
    addToBookshelf.mutate({ bookId: book.id });
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex space-x-4">
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={`Cover of ${book.title}`}
              className="w-16 h-24 object-cover rounded-md shadow-sm"
            />
          ) : (
            <div className="w-16 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-md flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-amber-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-gray-900 mb-1 line-clamp-2">{book.title}</CardTitle>
            {book.author && (
              <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
            )}
            {isInShelf && (
              <Badge className="bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" />
                In Library
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {book.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{book.description}</p>
        )}
        
        <div className="flex gap-2">
          {user && (
            <Button
              onClick={handleAddToShelf}
              disabled={isInShelf || addToBookshelf.isPending}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              size="sm"
            >
              {isInShelf ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Shelf
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm">
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
