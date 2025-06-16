
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Plus } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useReadingProgress } from '@/hooks/useReadingProgress';

interface CurrentReadsProps {
  userId?: string;
}

const CurrentReads: React.FC<CurrentReadsProps> = ({ userId }) => {
  const { data: readingProgress = [], isLoading } = useReadingProgress(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
            Your Current Reads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading your books...</div>
        </CardContent>
      </Card>
    );
  }

  if (readingProgress.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
            Your Current Reads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books in progress</h3>
            <p className="text-gray-500 mb-4">Start reading your first book to see your progress here</p>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Book
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
          Your Current Reads ({readingProgress.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel className="w-full">
          <CarouselContent>
            {readingProgress.map((book) => {
              const progressPercent = Math.round((book.current_page / book.total_pages) * 100);
              return (
                <CarouselItem key={book.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        {book.cover_image_url ? (
                          <img
                            src={book.cover_image_url}
                            alt={book.book_title}
                            className="w-16 h-24 object-cover rounded shadow"
                          />
                        ) : (
                          <div className="w-16 h-24 bg-amber-100 rounded flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-amber-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{book.book_title}</h4>
                          <p className="text-xs text-gray-500 mb-2">
                            Page {book.current_page} of {book.total_pages}
                          </p>
                          <Progress value={progressPercent} className="h-2 mb-2" />
                          <p className="text-xs text-amber-600 font-medium">{progressPercent}% complete</p>
                          <Button size="sm" variant="outline" className="mt-2 text-xs">
                            Update Progress
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </CardContent>
    </Card>
  );
};

export default CurrentReads;
