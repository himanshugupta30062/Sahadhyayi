
import React from 'react';
import BookFlipLoader from '@/components/ui/BookFlipLoader';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingGrid = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center py-12">
        <BookFlipLoader size="md" text="Loading your books..." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingGrid;
