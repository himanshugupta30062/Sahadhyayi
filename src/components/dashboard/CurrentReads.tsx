import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, ChevronRight } from 'lucide-react';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import AddBookToCurrentReadsDialog from './AddBookToCurrentReadsDialog';

interface CurrentReadsProps {
  userId?: string;
}

const CurrentReads: React.FC<CurrentReadsProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { data: bookshelf = [], isLoading, error } = useUserBookshelf();
  
  const readingBooks = bookshelf
    .filter(item => item.status === 'reading')
    .slice(0, 4)
    .map(item => ({
      id: item.id,
      book_id: item.book_id,
      title: item.books_library?.title || 'Unknown Title',
      author: item.books_library?.author,
      cover_image_url: item.books_library?.cover_image_url,
    }));

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base font-semibold">
            <BookOpen className="w-4 h-4 mr-2 text-[hsl(var(--brand-primary))]" />
            Currently Reading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-24 space-y-2">
                <div className="aspect-[2/3] rounded-lg bg-muted" />
                <div className="h-3 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center text-base font-semibold">
            <BookOpen className="w-4 h-4 mr-2 text-[hsl(var(--brand-primary))]" />
            Currently Reading
          </CardTitle>
          <AddBookToCurrentReadsDialog />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Error loading books. Please refresh.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (readingBooks.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center text-base font-semibold">
            <BookOpen className="w-4 h-4 mr-2 text-[hsl(var(--brand-primary))]" />
            Currently Reading
          </CardTitle>
          <AddBookToCurrentReadsDialog />
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No books in progress</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start reading to track your progress here
            </p>
            <Link to="/library">
              <Button 
                size="sm" 
                className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Find a Book
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-base font-semibold">
          <BookOpen className="w-4 h-4 mr-2 text-[hsl(var(--brand-primary))]" />
          Currently Reading ({readingBooks.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          <AddBookToCurrentReadsDialog />
          {bookshelf.filter(item => item.status === 'reading').length > 4 && (
            <Link to="/bookshelf">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {readingBooks.map((book) => (
            <button
              key={book.id}
              onClick={() => navigate(`/book/${book.book_id}`)}
              className="group text-left focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] focus:ring-offset-2 rounded-lg"
            >
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-sm group-hover:shadow-md transition-all">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--brand-primary)/0.2)] to-[hsl(var(--brand-secondary)/0.2)] flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-[hsl(var(--brand-primary))]" />
                  </div>
                )}
              </div>
              <div className="mt-2 space-y-0.5">
                <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-[hsl(var(--brand-primary))] transition-colors">
                  {book.title}
                </h4>
                {book.author && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full mt-2 text-xs h-8 border-border hover:border-[hsl(var(--brand-primary))] hover:text-[hsl(var(--brand-primary))]"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/book/${book.book_id}`);
                }}
              >
                Continue
              </Button>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentReads;
