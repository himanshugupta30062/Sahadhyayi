
import React, { FC } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Users, Heart } from 'lucide-react';

interface LoadingSpinnerProps {
  type?: 'default' | 'page' | 'posts' | 'books';
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ type = 'default' }) => {
  if (type === 'page') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">Loading...</p>
            <p className="text-sm text-gray-500">Please wait while we prepare your content</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'posts') {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/90 backdrop-blur-sm rounded-lg border border-amber-200 p-4">
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
                <Heart className="w-4 h-4 text-gray-300" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-300" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'books') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4">
            <Skeleton className="h-48 w-full rounded-lg mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
