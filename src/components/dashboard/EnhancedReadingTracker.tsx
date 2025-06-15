
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp } from 'lucide-react';
import { useReadingProgress, useUpdateReadingProgress } from '@/hooks/useReadingProgress';

const EnhancedReadingTracker = () => {
  const { data: progressData = [], isLoading } = useReadingProgress();
  const updateProgress = useUpdateReadingProgress();

  const handleProgressUpdate = (id: number, currentPage: number, increment: number) => {
    const newPage = Math.max(0, currentPage + increment);
    updateProgress.mutate({ id, current_page: newPage });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Reading Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-200 h-16 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-16 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Reading Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {progressData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No books in progress yet.</p>
            <p className="text-sm">Start reading to track your progress!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {progressData.slice(0, 3).map((book) => {
              const progressPercent = (book.current_page / book.total_pages) * 100;
              return (
                <div key={book.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{book.book_title}</h4>
                    <span className="text-xs text-gray-500">
                      {book.current_page}/{book.total_pages}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="mb-3" />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleProgressUpdate(book.id, book.current_page, -1)}
                      disabled={book.current_page <= 0}
                    >
                      -1
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleProgressUpdate(book.id, book.current_page, 1)}
                      disabled={book.current_page >= book.total_pages}
                    >
                      +1
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleProgressUpdate(book.id, book.current_page, 10)}
                      disabled={book.current_page >= book.total_pages}
                    >
                      +10
                    </Button>
                  </div>
                </div>
              );
            })}
            {progressData.length > 3 && (
              <Button variant="ghost" className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                View All Progress
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedReadingTracker;
