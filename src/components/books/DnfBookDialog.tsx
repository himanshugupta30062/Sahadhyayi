import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookX, Loader2 } from 'lucide-react';
import {
  BookshelfItem,
  DnfReason,
  DNF_REASON_LABELS,
  useMarkAsDnf,
} from '@/hooks/useUserBookshelf';

interface DnfBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookshelfItem: BookshelfItem | null;
  currentPage?: number;
  totalPages?: number;
  onSuccess?: () => void;
}

export const DnfBookDialog: React.FC<DnfBookDialogProps> = ({
  open,
  onOpenChange,
  bookshelfItem,
  currentPage,
  totalPages,
  onSuccess,
}) => {
  const markAsDnf = useMarkAsDnf();

  const [stoppedPage, setStoppedPage] = useState<number>(1);
  const [abandonDate, setAbandonDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState<DnfReason>('lost_interest');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (bookshelfItem) {
      const initialPage =
        bookshelfItem.dnf_page ||
        currentPage ||
        1;
      setStoppedPage(initialPage);
      setAbandonDate(
        bookshelfItem.dnf_date
          ? bookshelfItem.dnf_date.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setReason(bookshelfItem.dnf_reason || 'lost_interest');
      setNotes(bookshelfItem.dnf_notes || '');
    }
  }, [bookshelfItem, currentPage]);

  if (!bookshelfItem) return null;

  const bookTitle = bookshelfItem.books_library?.title || bookshelfItem.book?.title || 'this book';
  const maxPage = totalPages || bookshelfItem.books_library?.pages || 9999;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safePage = Math.max(1, Math.min(stoppedPage, maxPage));

    markAsDnf.mutate(
      {
        id: bookshelfItem.id,
        dnf_page: safePage,
        dnf_date: new Date(abandonDate).toISOString(),
        dnf_reason: reason,
        dnf_notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <BookX className="w-5 h-5" />
            <DialogTitle className="text-foreground">Did Not Finish (DNF)</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            Life is too short for books you don&apos;t enjoy! Record where you stopped and why. Your honest reflections remain private and refine your future recommendations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
            <p className="font-semibold text-foreground line-clamp-1">{bookTitle}</p>
            {bookshelfItem.books_library?.author && (
              <p className="text-muted-foreground">by {bookshelfItem.books_library.author}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dnf-page" className="text-xs font-medium text-foreground">
                Stopped at Page
              </Label>
              <Input
                id="dnf-page"
                type="number"
                min={1}
                max={maxPage}
                value={stoppedPage}
                onChange={(e) => setStoppedPage(parseInt(e.target.value, 10) || 1)}
                className="h-9 text-xs"
                required
              />
              {totalPages && (
                <span className="text-[10px] text-muted-foreground">of {totalPages} pages</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dnf-date" className="text-xs font-medium text-foreground">
                Abandon Date
              </Label>
              <Input
                id="dnf-date"
                type="date"
                value={abandonDate}
                onChange={(e) => setAbandonDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dnf-reason" className="text-xs font-medium text-foreground">
              Primary Reason
            </Label>
            <Select value={reason} onValueChange={(v) => setReason(v as DnfReason)}>
              <SelectTrigger id="dnf-reason" className="h-9 text-xs">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DNF_REASON_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dnf-notes" className="text-xs font-medium text-foreground">
              Private Notes &amp; Reflections (Optional)
            </Label>
            <Textarea
              id="dnf-notes"
              placeholder="What didn't work for you? (e.g. pace picked down in chapter 4, felt repetitive...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[70px] resize-none"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {notes.length}/500
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={markAsDnf.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={markAsDnf.isPending}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              {markAsDnf.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Move to DNF'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DnfBookDialog;
