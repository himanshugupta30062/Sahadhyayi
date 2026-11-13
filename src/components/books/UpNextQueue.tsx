import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ListOrdered,
  ChevronUp,
  ChevronDown,
  Play,
  X,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { BookshelfItem, useUpNextQueue } from '@/hooks/useUserBookshelf';
import { Link } from 'react-router-dom';

interface UpNextQueueProps {
  bookshelfItems: BookshelfItem[];
  onOpenWantToRead?: () => void;
}

export const UpNextQueue: React.FC<UpNextQueueProps> = ({
  bookshelfItems,
  onOpenWantToRead,
}) => {
  const { removeFromUpNext, reorderUpNext, startReadingFromQueue } = useUpNextQueue();

  // Filter items in Up Next queue (up_next_position != null)
  const queuedItems = bookshelfItems
    .filter((b) => b.up_next_position != null && b.up_next_position >= 1 && b.up_next_position <= 5)
    .sort((a, b) => (a.up_next_position || 0) - (b.up_next_position || 0));

  const totalSlots = 5;
  const filledCount = queuedItems.length;

  return (
    <Card className="border-border bg-gradient-to-br from-amber-500/5 via-primary/5 to-transparent shadow-xs">
      <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ListOrdered className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              Up Next Reading Queue
              <Badge variant="outline" className="text-[11px] font-normal border-amber-500/30 text-amber-700 dark:text-amber-300">
                {filledCount} of {totalSlots} slots
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prioritize your next reads in order. Start reading directly to auto-compact the queue.
            </p>
          </div>
        </div>

        {filledCount < totalSlots && onOpenWantToRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenWantToRead}
            className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10 hidden sm:flex"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Pick from Want to Read
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: totalSlots }).map((_, index) => {
            const slotNumber = index + 1;
            const item = queuedItems.find((q) => q.up_next_position === slotNumber);

            if (item) {
              const book = item.books_library;
              const isFirst = slotNumber === 1;
              const isLast = slotNumber === queuedItems.length;

              return (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-amber-500/20 bg-card p-3 shadow-xs flex flex-col justify-between hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Position Badge */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold shadow-xs">
                        {slotNumber}
                      </span>
                      {/* Reorder Buttons */}
                      <div className="flex flex-col -space-y-1">
                        <button
                          type="button"
                          aria-label={`Move ${book?.title || 'book'} up in queue`}
                          disabled={isFirst || reorderUpNext.isPending}
                          onClick={() => reorderUpNext.mutate({ itemId: item.id, direction: 'up', currentQueue: queuedItems })}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${book?.title || 'book'} down in queue`}
                          disabled={isLast || reorderUpNext.isPending}
                          onClick={() => reorderUpNext.mutate({ itemId: item.id, direction: 'down', currentQueue: queuedItems })}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Book Thumbnail */}
                    <div className="w-12 h-16 rounded overflow-hidden bg-muted shrink-0 shadow-xs">
                      {book?.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-500/10">
                          <BookOpen className="w-4 h-4 text-amber-500" />
                        </div>
                      )}
                    </div>

                    {/* Title & Author */}
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/book/${book?.id || item.book_id}`}
                        className="font-medium text-xs text-foreground line-clamp-2 hover:text-[hsl(var(--brand-primary))] transition-colors"
                      >
                        {book?.title || item.book?.title || 'Untitled Book'}
                      </Link>
                      {book?.author && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {book.author}
                        </p>
                      )}
                    </div>

                    {/* Remove from queue */}
                    <button
                      type="button"
                      aria-label="Remove from Up Next"
                      onClick={() =>
                        removeFromUpNext.mutate({
                          bookshelfItemId: item.id,
                          currentQueue: queuedItems,
                        })
                      }
                      disabled={removeFromUpNext.isPending}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Start Reading CTA */}
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <Button
                      size="sm"
                      onClick={() =>
                        startReadingFromQueue.mutate({
                          bookshelfItemId: item.id,
                          currentQueue: queuedItems,
                        })
                      }
                      disabled={startReadingFromQueue.isPending}
                      className="w-full h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                    >
                      <Play className="w-3 h-3 mr-1 fill-current" />
                      Start Reading
                    </Button>
                  </div>
                </div>
              );
            }

            // Empty Slot
            return (
              <div
                key={`empty-slot-${slotNumber}`}
                className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 flex flex-col items-center justify-center text-center min-h-[140px]"
              >
                <span className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground/60 text-xs font-semibold flex items-center justify-center mb-2">
                  {slotNumber}
                </span>
                <p className="text-xs font-medium text-muted-foreground">Empty Slot</p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                  Select &ldquo;Add to Up Next&rdquo; on any book to queue here
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpNextQueue;
