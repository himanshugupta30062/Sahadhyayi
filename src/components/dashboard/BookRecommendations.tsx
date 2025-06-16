
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Star } from 'lucide-react';
import { useLibraryBooks } from '@/hooks/useLibrary';

interface BookRecommendationsProps {
  userId?: string;
}

const BookRecommendations: React.FC<BookRecommendationsProps> = ({ userId }) => {
  const { data: libraryBooks = [], isLoading } = useLibraryBooks();
  
  // Get first 4 books as recommendations
  const recommendations = libraryBooks.slice(0, 4);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2 text-amber-600" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading recommendations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="w-5 h-5 mr-2 text-amber-600" />
          Recommended for You
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((book) => (
            <div key={book.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex space-x-3">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-16 bg-amber-100 rounded flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-amber-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate text-gray-900">{book.title}</h4>
                  <p className="text-xs text-gray-500 mb-2">{book.author || 'Unknown Author'}</p>
                  {book.genre && (
                    <span className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full mb-2">
                      {book.genre}
                    </span>
                  )}
                  <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus className="w-3 h-3 mr-1" />
                    Add to My List
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {recommendations.length === 0 && (
          <div className="text-center py-8">
            <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No recommendations available yet</p>
            <p className="text-sm text-gray-400">Start reading books to get personalized recommendations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookRecommendations;
