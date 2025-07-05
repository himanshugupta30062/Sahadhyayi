
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, CheckCircle, Plus } from 'lucide-react';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { Link } from 'react-router-dom';

const EnhancedBookshelf = () => {
  const { data: bookshelf = [], isLoading } = useUserBookshelf();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'want_to_read': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reading': return <Clock className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      default: return <BookOpen className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
            My Bookshelf
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading your books...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
          My Bookshelf ({bookshelf.length})
        </CardTitle>
        <Link to="/bookshelf">
          <Button size="sm" variant="outline">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {bookshelf.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">Your bookshelf is empty</p>
            <Link to="/library">
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Books
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookshelf.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                {item.books_library?.cover_image_url ? (
                  <img
                    src={item.books_library.cover_image_url}
                    alt={item.books_library?.title}
                    className="w-10 h-14 object-cover rounded shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-14 bg-amber-100 rounded flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {item.books_library?.title || 'Unknown Title'}
                  </h4>
                  <p className="text-sm text-gray-500 truncate">
                    {item.books_library?.author || 'Unknown Author'}
                  </p>
                  <Badge className={`${getStatusColor(item.status)} mt-1`}>
                    {getStatusIcon(item.status)}
                    <span className="ml-1 capitalize">{item.status?.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </div>
            ))}
            {bookshelf.length > 5 && (
              <Link to="/bookshelf">
                <Button variant="ghost" className="w-full">
                  View {bookshelf.length - 5} more books
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedBookshelf;
