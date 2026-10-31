import React from 'react';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { useAuth } from '@/contexts/authHelpers';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import LibraryBookGrid from '@/components/library/LibraryBookGrid';

const MyLibrary = () => {
  const { user } = useAuth();
  const { data: bookshelfData, isLoading, error } = useUserBookshelf();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Sign in to view your personal library.</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    console.error('Error loading bookshelf:', error);
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load your library. Please try again.</p>
      </div>
    );
  }

  if (!bookshelfData || bookshelfData.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Library is Empty</h3>
          <p className="text-gray-600 mb-6">
            Start building your personal library by adding books from the "All Books" section.
          </p>
          <p className="text-sm text-gray-500">
            Use the "Add to Shelf" button on any book to add it to your personal collection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <LibraryBookGrid items={bookshelfData} showStatusBadge />;
};

export default MyLibrary;
