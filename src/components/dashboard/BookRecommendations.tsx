import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { useBookRecommendations } from '@/hooks/useBookRecommendations';
import { useAddToBookshelf } from '@/hooks/useUserBookshelf';

interface BookRecommendationsProps {
  userId?: string;
}

const BookRecommendations: React.FC<BookRecommendationsProps> = ({ userId }) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;
  const { data: recommendations = [], isLoading } = useBookRecommendations(targetId);
  const addToBookshelf = useAddToBookshelf();

  const handleAddToShelf = (bookId: string) => {
    addToBookshelf.mutate({ bookId, status: 'want_to_read' });
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base font-semibold">
            <Sparkles className="w-4 h-4 mr-2 text-[hsl(var(--brand-primary))]" />
            For You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-12 h-16 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base font-semibold">
            <Sparkles className="w-4 h-4 mr-2 text-[hsl(var(--brand-primary))]" />
            For You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No recommendations yet</p>
            <p className="text-xs text-muted-foreground">Add books to get personalized picks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base font-semibold">
          <Sparkles className="w-4 h-4 mr-2 text-[hsl(var(--brand-primary))]" />
          For You
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.slice(0, 4).map((book) => (
          <div 
            key={book.id} 
            className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <Link to={`/book/${book.id}`} className="shrink-0">
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  loading="lazy"
                  className="w-12 h-16 object-cover rounded shadow-sm"
                />
              ) : (
                <div className="w-12 h-16 rounded bg-gradient-to-br from-[hsl(var(--brand-primary)/0.2)] to-[hsl(var(--brand-secondary)/0.2)] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/book/${book.id}`}>
                <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-[hsl(var(--brand-primary))] transition-colors">
                  {book.title}
                </h4>
              </Link>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {book.author || 'Unknown Author'}
              </p>
              {book.genre && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {book.genre}
                </span>
              )}
              <Button 
                size="sm" 
                variant="ghost"
                className="w-full mt-1 h-7 text-xs text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.1)]"
                onClick={() => handleAddToShelf(book.id)}
                disabled={addToBookshelf.isPending}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add to Shelf
              </Button>
            </div>
          </div>
        ))}
        
        <Link to="/library" className="block">
          <Button variant="outline" size="sm" className="w-full border-border text-muted-foreground hover:text-foreground">
            Browse More
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default BookRecommendations;
