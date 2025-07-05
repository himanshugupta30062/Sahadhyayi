import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Plus } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import AddBookToCurrentReadsDialog from './AddBookToCurrentReadsDialog';

interface CurrentReadsProps {
  userId?: string;
}

const CurrentReads: React.FC<CurrentReadsProps> = ({ userId }) => {
  const { data: readingProgress = [], isLoading } = useReadingProgress();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-600" />
            Your Current Reads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">Loading your books...</div>
        </CardContent>
      </Card>
    );
  }

  if (readingProgress.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-600" />
            Your Current Reads
          </CardTitle>
          <AddBookToCurrentReadsDialog />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 sm:py-12">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No books in progress</h3>
            <p className="text-gray-500 mb-4 text-sm sm:text-base px-4">Start reading your first book to see your progress here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-base sm:text-lg">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-600" />
          Your Current Reads ({readingProgress.length})
        </CardTitle>
        <AddBookToCurrentReadsDialog />
      </CardHeader>
      <CardContent>
        <div className="block sm:hidden">
          {/* Mobile: Stack layout */}
          <div className="space-y-4">
            {readingProgress.map((book) => {
              const progressPercent = Math.round((book.current_page / book.total_pages) * 100);
              return (
                <Card key={book.id} className="p-4">
                  <div className="flex space-x-3">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.book_title}
                        className="w-12 h-16 object-cover rounded shadow flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-amber-100 rounded flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-amber-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{book.book_title}</h4>
                      <p className="text-xs text-gray-500 mb-2">
                        Page {book.current_page} of {book.total_pages}
                      </p>
                      <Progress value={progressPercent} className="h-2 mb-2" />
                      <p className="text-xs text-amber-600 font-medium mb-2">{progressPercent}% complete</p>
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        Update Progress
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        
        <div className="hidden sm:block">
          {/* Desktop: Carousel layout */}
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
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentReads;
