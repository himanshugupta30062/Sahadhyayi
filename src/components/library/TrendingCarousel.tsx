
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';

const TrendingCarousel = () => {
  const { data: books = [], isLoading } = useLibraryBooks();

  const trendingBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
  }, [books]);

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Trending Books</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {isLoading
            ? [...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-48 h-40 bg-gray-200 rounded-lg animate-pulse" />
              ))
            : trendingBooks.map((book) => (
                <Card key={book.id} className="flex-shrink-0 w-48 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="w-full h-32 bg-gradient-to-br from-green-500 to-blue-600 rounded mb-3 flex items-center justify-center text-white font-bold text-sm">
                      {book.title.slice(0, 20)}...
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{book.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{book.author}</p>
                    {/* Removed ratings display */}
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingCarousel;
