import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, FileText } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author?: string;
  genre?: string;
  cover_image_url?: string;
  description?: string;
  publication_year?: number;
  pages?: number;
  language?: string;
  isbn?: string;
}

interface BookTestGridProps {
  books: Book[];
  loading: boolean;
}

const BookTestGrid: React.FC<BookTestGridProps> = ({ books, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array(8).fill(0).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="w-full h-48 bg-muted rounded-md" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Books Found</h3>
          <p className="text-muted-foreground">
            Try searching for books using the search bar above, or adjust your search terms.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {books.map((book) => (
        <Card key={book.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <div className="relative overflow-hidden rounded-md bg-muted">
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={`Cover of ${book.title}`}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`${book.cover_image_url ? 'hidden' : ''} w-full h-48 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5`}>
                <BookOpen className="w-12 h-12 text-primary/40" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              {book.author && (
                <p className="text-muted-foreground text-sm mt-1">by {book.author}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {book.genre && (
                <Badge variant="secondary" className="text-xs">
                  {book.genre}
                </Badge>
              )}
              {book.language && book.language !== 'English' && (
                <Badge variant="outline" className="text-xs">
                  {book.language}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {book.publication_year && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{book.publication_year}</span>
                </div>
              )}
              {book.pages && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>{book.pages} pages</span>
                </div>
              )}
            </div>

            {book.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {book.description}
              </p>
            )}

            {book.isbn && (
              <p className="text-xs text-muted-foreground font-mono">
                ISBN: {book.isbn}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BookTestGrid;