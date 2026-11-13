import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookMarked,
  Clock,
  CheckCircle,
  BookX,
  ListOrdered,
  ChevronDown,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { useNavigate } from 'react-router-dom';
import {
  useUserBookshelf,
  useAddToBookshelf,
  useUpdateBookshelfItem,
  useRemoveFromBookshelf,
  useUpNextQueue,
  BookshelfItem,
} from '@/hooks/useUserBookshelf';
import DnfBookDialog from './DnfBookDialog';

interface BookshelfStatusPickerProps {
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
  totalPages?: number;
  className?: string;
}

export const BookshelfStatusPicker: React.FC<BookshelfStatusPickerProps> = ({
  bookId,
  bookTitle,
  bookAuthor,
  totalPages,
  className = '',
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: shelf = [] } = useUserBookshelf();
  const addToBookshelf = useAddToBookshelf();
  const updateBookshelf = useUpdateBookshelfItem();
  const removeFromBookshelf = useRemoveFromBookshelf();
  const { addToUpNext, removeFromUpNext } = useUpNextQueue();

  const [dnfOpen, setDnfOpen] = useState(false);

  const existingItem = shelf.find((item) => item.book_id === bookId);
  const queuedItems = shelf.filter((b) => b.up_next_position != null);
  const isQueued = existingItem?.up_next_position != null;

  const handleSignIn = () => {
    navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname)}&intent=add_shelf&book_id=${encodeURIComponent(bookId)}`);
  };

  const handleSetStatus = (status: 'want_to_read' | 'reading' | 'completed' | 'dnf') => {
    if (!user) {
      handleSignIn();
      return;
    }

    if (status === 'dnf') {
      if (existingItem) {
        setDnfOpen(true);
      } else {
        addToBookshelf.mutate(
          { bookId, status: 'want_to_read' },
          {
            onSuccess: (data) => {
              setDnfOpen(true);
            },
          }
        );
      }
      return;
    }

    if (existingItem) {
      updateBookshelf.mutate({ id: existingItem.id, updates: { status } });
    } else {
      addToBookshelf.mutate({ bookId, status });
    }
  };

  const handleToggleUpNext = () => {
    if (!user) {
      handleSignIn();
      return;
    }

    if (isQueued && existingItem) {
      removeFromUpNext.mutate({
        bookshelfItemId: existingItem.id,
        currentQueue: queuedItems,
      });
    } else if (existingItem) {
      addToUpNext.mutate({
        bookshelfItemId: existingItem.id,
        currentQueueLength: queuedItems.length,
      });
    } else {
      addToBookshelf.mutate(
        { bookId, status: 'want_to_read' },
        {
          onSuccess: (data: any) => {
            if (data?.id) {
              addToUpNext.mutate({
                bookshelfItemId: data.id,
                currentQueueLength: queuedItems.length,
              });
            }
          },
        }
      );
    }
  };

  const isLoading =
    addToBookshelf.isPending ||
    updateBookshelf.isPending ||
    removeFromBookshelf.isPending ||
    addToUpNext.isPending ||
    removeFromUpNext.isPending;

  const getStatusLabel = (item?: BookshelfItem) => {
    if (!item) return 'Add to Shelf';
    switch (item.status) {
      case 'reading':
        return 'Currently Reading';
      case 'completed':
        return 'Read / Completed';
      case 'dnf':
        return 'Did Not Finish (DNF)';
      case 'want_to_read':
      default:
        return 'Want to Read';
    }
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={existingItem ? 'outline' : 'default'}
              disabled={isLoading}
              className={`w-full justify-between gap-2 h-11 text-sm font-semibold shadow-xs ${
                existingItem
                  ? 'border-border bg-card hover:bg-muted text-foreground'
                  : 'bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : existingItem?.status === 'reading' ? (
                  <Clock className="w-4 h-4 text-blue-500" />
                ) : existingItem?.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : existingItem?.status === 'dnf' ? (
                  <BookX className="w-4 h-4 text-rose-500" />
                ) : existingItem?.status === 'want_to_read' ? (
                  <BookMarked className="w-4 h-4 text-amber-500" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {getStatusLabel(existingItem)}
                {isQueued && (
                  <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                    Queue #{existingItem?.up_next_position}
                  </span>
                )}
              </span>
              <ChevronDown className="w-4 h-4 opacity-70 shrink-0" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => handleSetStatus('want_to_read')}
              className={existingItem?.status === 'want_to_read' ? 'font-semibold text-amber-600' : ''}
            >
              <BookMarked className="w-4 h-4 mr-2 text-amber-500" />
              Want to Read
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleSetStatus('reading')}
              className={existingItem?.status === 'reading' ? 'font-semibold text-blue-600' : ''}
            >
              <Clock className="w-4 h-4 mr-2 text-blue-500" />
              Currently Reading
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleSetStatus('completed')}
              className={existingItem?.status === 'completed' ? 'font-semibold text-emerald-600' : ''}
            >
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
              Read / Completed
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleSetStatus('dnf')}
              className={existingItem?.status === 'dnf' ? 'font-semibold text-rose-600' : ''}
            >
              <BookX className="w-4 h-4 mr-2 text-rose-500" />
              Did Not Finish (DNF)
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Up Next Queue */}
            <DropdownMenuItem
              onClick={handleToggleUpNext}
              disabled={!isQueued && queuedItems.length >= 5}
            >
              <ListOrdered className="w-4 h-4 mr-2 text-amber-500" />
              {isQueued
                ? 'Remove from Up Next Queue'
                : `Add to Up Next Queue (${queuedItems.length}/5)`}
            </DropdownMenuItem>

            {existingItem && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => removeFromBookshelf.mutate(existingItem.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove from Shelf
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {existingItem && (
        <DnfBookDialog
          open={dnfOpen}
          onOpenChange={setDnfOpen}
          bookshelfItem={existingItem}
          currentPage={existingItem.dnf_page || 1}
          totalPages={totalPages}
        />
      )}
    </>
  );
};

export default BookshelfStatusPicker;
