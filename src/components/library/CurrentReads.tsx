import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/authHelpers';
import { fetchCurrentReads, updateLastOpenedAt, type CurrentRead } from '@/lib/supabase/userBooks';

const CurrentReads: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: books, isLoading, error } = useQuery<CurrentRead[]>({
    queryKey: ['current-reads', user?.id],
    queryFn: fetchCurrentReads,
    enabled: !!user,
  });

  const handleOpen = async (book: CurrentRead) => {
    try {
      await updateLastOpenedAt(book.id);
    } catch (err) {
      console.error('Failed to update last opened time', err);
    }
    navigate(`/book/${book.book_id}`);
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
            Your Current Reads
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">Sign in to track your reading progress.</p>
          <Button asChild>
            <Link to="/sign-in">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
            Your Current Reads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500 text-sm">Loading your books...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
            Your Current Reads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500 text-sm">Failed to load your books.</div>
        </CardContent>
      </Card>
    );
  }

  if (!books || books.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
            Your Current Reads
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">Start reading a book to see it here.</p>
          <Button asChild>
            <Link to="/library">Start reading a book</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base">
          <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
          Your Current Reads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {books.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer overflow-hidden"
              onClick={() => handleOpen(item)}
            >
              <CardContent className="p-4 flex gap-4">
                {item.books_library?.cover_image_url ? (
                  <img
                    src={item.books_library.cover_image_url}
                    alt={item.books_library.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-24 bg-amber-100 rounded flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-amber-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{item.books_library.title}</h4>
                  {typeof item.progress === 'number' && (
                    <div className="mt-2">
                      <Progress value={item.progress} className="h-2" />
                      <p className="text-xs text-gray-600 mt-1">{Math.round(item.progress)}%</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentReads;
