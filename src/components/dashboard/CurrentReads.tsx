import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, ChevronRight, Play } from 'lucide-react';
import { useUserBookshelf, useUpdateBookshelfItem } from '@/hooks/useUserBookshelf';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { loadProgressLocally } from '@/utils/readingProgressStorage';
import AddBookToCurrentReadsDialog from './AddBookToCurrentReadsDialog';

interface CurrentReadsProps {
  userId?: string;
}

const CurrentReads: React.FC<CurrentReadsProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { data: bookshelf = [], isLoading, error } = useUserBookshelf();
  const { data: dbProgress = [] } = useReadingProgress();
  const updateBookshelf = useUpdateBookshelfItem();
  
  const readingBooks = bookshelf
    .filter(item => item.status === 'reading')
    .slice(0, 4)
    .map(item => {
      const localProgress = loadProgressLocally(item.book_id, userId);
      const dbItem = dbProgress.find(p => p.book_id === item.book_id);

      const currentPage = Math.max(localProgress?.currentPage || 0, dbItem?.current_page || 0, 1);
      const totalPages = Math.max(localProgress?.totalPages || 0, dbItem?.total_pages || 0, 1);
      const hasKnownTotal = totalPages > 1;
      const progressPercent = hasKnownTotal 
        ? Math.min(100, Math.round((currentPage / totalPages) * 100))
        : 0;

      return {
        id: item.id,
        book_id: item.book_id,
        title: item.books_library?.title || 'Unknown Title',
        author: item.books_library?.author,
        cover_image_url: item.books_library?.cover_image_url,
        currentPage,
        totalPages,
        progressPercent,
        hasKnownTotal,
      };
    });

  const wantToReadBooks = bookshelf
    .filter(item => item.status === 'want_to_read')
    .slice(0, 3);

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle as="h2" className="flex items-center text-base font-semibold">
            <BookOpen className="w-4 h-4 mr-2 text-[hsl(var(--brand-primary))]" />
            Currently Reading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-28 space-y-2">
                <div className="aspect-[2/3] rounded-lg bg-muted" />
                <div className="h-3 bg-muted rounded" />
                <div className="h-2 bg-muted rounded w-2/3" />
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
          <CardTitle as="h2" className="flex items-center text-base font-semibold">
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
          <CardTitle as="h2" className="flex items-center text-base font-semibold">
            <BookOpen className="w-4 h-4 mr-2 text-[hsl(var(--brand-primary))]" />
            Currently Reading
          </CardTitle>
          <AddBookToCurrentReadsDialog />
        </CardHeader>
        <CardContent>
          {wantToReadBooks.length > 0 ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Pick up from your shelf to start reading:
                </p>
                <Link to="/bookshelf" className="text-xs text-[hsl(var(--brand-primary))] hover:underline flex items-center">
                  All books <ChevronRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {wantToReadBooks.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-2.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors items-center"
                  >
                    <div className="w-12 h-16 rounded overflow-hidden bg-muted shrink-0 shadow-xs">
                      {item.books_library?.cover_image_url ? (
                        <img
                          src={item.books_library.cover_image_url}
                          alt={item.books_library.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                        {item.books_library?.title || 'Untitled'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
                        {item.books_library?.author || 'Unknown author'}
                      </p>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-6 text-[10px] px-2 bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white w-full"
                        onClick={() => {
                          updateBookshelf.mutate({
                            id: item.id,
                            updates: { status: 'reading' },
                          });
                        }}
                      >
                        <Play className="w-3 h-3 mr-1 fill-current" />
                        Start Reading
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No books in progress</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start reading to track your live page count and progress here
              </p>
              <Link to="/library">
                <Button 
                  size="sm" 
                  className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Find a Book
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle as="h2" className="flex items-center text-base font-semibold">
          <BookOpen className="w-4 h-4 mr-2 text-[hsl(var(--brand-primary))]" />
          Currently Reading ({readingBooks.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          <AddBookToCurrentReadsDialog />
          {bookshelf.filter(item => item.status === 'reading').length > 4 && (
            <Link to="/bookshelf">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {readingBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => navigate(`/book/${book.book_id}`)}
              className="group text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] focus:ring-offset-2 rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-xs group-hover:shadow-md transition-all relative">
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
                  {book.hasKnownTotal && book.progressPercent > 0 && (
                    <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-xs text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow-xs">
                      {book.progressPercent}%
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

                {/* Progress bar and indicator */}
                <div className="mt-2 space-y-1">
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[hsl(var(--brand-primary))] h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${book.hasKnownTotal && book.progressPercent > 0 ? book.progressPercent : 8}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>
                      {book.hasKnownTotal 
                        ? `Pg ${book.currentPage} of ${book.totalPages}` 
                        : `Page ${book.currentPage}`}
                    </span>
                    {book.hasKnownTotal && (
                      <span className="font-semibold text-foreground">{book.progressPercent}%</span>
                    )}
                  </div>
                </div>
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
                {book.currentPage > 1 ? `Resume · Pg ${book.currentPage}` : 'Continue'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentReads;
