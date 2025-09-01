import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Users, Heart } from 'lucide-react';
import BookFlipLoader from '@/components/ui/BookFlipLoader';

interface LoadingSpinnerProps {
  type?: 'default' | 'page' | 'posts' | 'books';
}

const PostsLoader = memo(() => (
  <div className="space-y-6 animate-fade-in">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-lg mb-4" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-muted-foreground" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      </div>
    ))}
  </div>
));

const BooksLoader = memo(() => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-card rounded-lg shadow-sm p-4 animate-pulse">
        <Skeleton className="h-48 w-full rounded-lg mb-4" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2 mb-2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    ))}
  </div>
));

const PageLoader = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-background via-brand-neutral to-background flex items-center justify-center">
    <BookFlipLoader size="lg" text="Loading your library..." />
  </div>
));

const DefaultLoader = memo(() => (
  <div className="flex items-center justify-center py-8">
    <BookFlipLoader size="sm" />
  </div>
));

const OptimizedLoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({ type = 'default' }) => {
  switch (type) {
    case 'page':
      return <PageLoader />;
    case 'posts':
      return <PostsLoader />;
    case 'books':
      return <BooksLoader />;
    default:
      return <DefaultLoader />;
  }
});

OptimizedLoadingSpinner.displayName = 'OptimizedLoadingSpinner';

export default OptimizedLoadingSpinner;