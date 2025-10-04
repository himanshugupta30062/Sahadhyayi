
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import { useAuth } from '@/contexts/authHelpers';
import { useBookRecommendations } from '@/hooks/useBookRecommendations';

interface BookRecommendationsProps {
  userId?: string;
}

const BookRecommendations: React.FC<BookRecommendationsProps> = ({ userId }) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;
  const { data: recommendations = [], isLoading } = useBookRecommendations(targetId);

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
        <div className="grid grid-cols-1 gap-4">
          {recommendations.map((book) => (
            <Card key={book.id} className="p-4 hover:shadow-md transition-shadow border border-gray-200">
              <div className="flex space-x-3">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    loading="lazy"
                    className="w-16 h-20 object-cover rounded shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-20 bg-amber-100 rounded flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-amber-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h4 className="font-semibold text-sm line-clamp-2 text-gray-900">{book.title}</h4>
                    <p className="text-xs text-gray-500">
                      {book.author ? (
                        <Link to={`/authors/${slugify(book.author)}`}>{book.author}</Link>
                      ) : (
                        'Unknown Author'
                      )}
                    </p>
                  </div>
                  {book.genre && (
                    <span className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
                      {book.genre}
                    </span>
                  )}
                  <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Add to List
                  </Button>
                </div>
              </div>
            </Card>
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
