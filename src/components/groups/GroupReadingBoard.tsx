import { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, CheckCircle2, Clock3, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BookSelectionModal } from '@/components/social/BookSelectionModal';
import {
  useAddGroupReadingBook,
  useGroupReadingBooks,
  useRemoveGroupReadingBook,
  useSaveGroupReadingProgress,
  useSetGroupReadingBookStatus,
} from '@/hooks/useGroupReadingBoard';
import type { GroupReadingBook, GroupReadingBookStatus } from '@/hooks/useGroupReadingBoard';

interface GroupReadingBoardProps {
  groupId: string;
  canManage: boolean;
}

const statusLabels: Record<GroupReadingBookStatus, string> = {
  current: 'Current read',
  up_next: 'Up next',
  completed: 'Completed',
  archived: 'Archived',
};

const formatDate = (date: string | null) => {
  if (!date) return null;
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const GroupReadingBoard = ({ groupId, canManage }: GroupReadingBoardProps) => {
  const { data: books = [], isLoading, error } = useGroupReadingBooks(groupId, true);
  const addBook = useAddGroupReadingBook();
  const setStatus = useSetGroupReadingBookStatus();
  const removeBook = useRemoveGroupReadingBook();
  const saveProgress = useSaveGroupReadingProgress();
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<GroupReadingBook | null>(null);
  const [pageDrafts, setPageDrafts] = useState<Record<string, string>>({});
  const [shareDrafts, setShareDrafts] = useState<Record<string, boolean>>({});

  const currentBook = books.find((book) => book.status === 'current');
  const sections = useMemo(() => [
    { status: 'current' as const, title: 'Reading together', items: books.filter((book) => book.status === 'current') },
    { status: 'up_next' as const, title: 'Up next', items: books.filter((book) => book.status === 'up_next') },
    { status: 'completed' as const, title: 'Finished together', items: books.filter((book) => book.status === 'completed') },
    { status: 'archived' as const, title: 'Archived', items: books.filter((book) => book.status === 'archived') },
  ], [books]);

  const handleAddBook = (book: { id: string; title: string }) => {
    addBook.mutate(
      { groupId, bookId: book.id },
      {
        onSuccess: () => toast.success(`“${book.title}” added to the group reading list.`),
        onError: (mutationError) => toast.error(mutationError.message),
      },
    );
  };

  const handleStatusChange = (book: GroupReadingBook, status: GroupReadingBookStatus) => {
    setStatus.mutate(
      { groupId, readingBookId: book.id, status },
      {
        onSuccess: () => toast.success(`${book.title}: moved to ${statusLabels[status].toLowerCase()}.`),
        onError: (mutationError) => toast.error(mutationError.message),
      },
    );
  };

  const handleSaveProgress = (book: GroupReadingBook) => {
    const rawPage = pageDrafts[book.id] ?? String(book.my_current_page);
    const currentPage = Number(rawPage);
    if (!Number.isInteger(currentPage) || currentPage < 0) {
      toast.error('Enter a valid page number.');
      return;
    }
    if (book.pages && currentPage > book.pages) {
      toast.error(`This book has ${book.pages} pages.`);
      return;
    }

    saveProgress.mutate(
      {
        groupId,
        readingBookId: book.id,
        currentPage,
        isShared: shareDrafts[book.id] ?? book.my_is_shared,
      },
      {
        onSuccess: () => toast.success('Your reading progress is saved.'),
        onError: (mutationError) => toast.error(mutationError.message),
      },
    );
  };

  const renderBook = (book: GroupReadingBook) => {
    const isShared = shareDrafts[book.id] ?? book.my_is_shared;
    const pageValue = pageDrafts[book.id] ?? String(book.my_current_page);
    const canTrack = book.status !== 'archived';
    const progress = typeof book.pages === 'number' && book.pages > 0
      ? Math.min(100, Math.round((book.my_current_page / book.pages) * 100))
      : null;

    return (
      <article key={book.id} className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background p-3 sm:flex-row sm:items-start">
        <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={`${book.title} cover`} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <BookOpen className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-foreground">{book.title}</h4>
            <Badge variant={book.status === 'current' ? 'default' : 'secondary'}>
              {statusLabels[book.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{book.author || 'Unknown author'}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {book.pages ? <span>{book.pages} pages</span> : null}
            {book.target_date ? (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> Target {formatDate(book.target_date)}
              </span>
            ) : null}
            {book.shared_reader_count > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {book.shared_reader_count} sharing
                {book.average_progress !== null ? ` · ${Math.round(book.average_progress)}% average` : ''}
              </span>
            ) : null}
          </div>

          {book.shared_reader_count > 0 && book.average_progress !== null && (\n            <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2" aria-label={`Group progress for ${book.title}`}>\n              <div className="flex items-center justify-between gap-2 text-xs">\n                <span className="font-medium text-foreground">Group reading progress</span>\n                <span className="tabular-nums text-muted-foreground">{Math.round(book.average_progress)}%</span>\n              </div>\n              <div role="progressbar" aria-label={`Shared progress for ${book.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, Math.round(book.average_progress)))} className="h-2 overflow-hidden rounded-full bg-muted">\n                <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, book.average_progress))}%` }} />\n              </div>\n              <p className="text-[11px] text-muted-foreground">Based only on members who opted in to share.</p>\n            </div>\n          )}\n\n          {canTrack && (
            <div className="space-y-2 rounded-lg bg-muted/40 p-3">
              <div className="flex flex-wrap items-end gap-2">
                <label className="min-w-0 flex-1">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Your current page</span>
                  <Input
                    aria-label={`Your current page for ${book.title}`}
                    type="number"
                    min={0}
                    max={book.pages ?? undefined}
                    value={pageValue}
                    onChange={(event) => setPageDrafts((drafts) => ({ ...drafts, [book.id]: event.target.value }))}
                    className="h-9"
                  />
                </label>
                {progress !== null && (
                  <span className="pb-2 text-xs tabular-nums text-muted-foreground">
                    Saved: {progress}%
                  </span>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveProgress(book)}
                  disabled={saveProgress.isPending}
                >
                  Save progress
                </Button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(event) => setShareDrafts((drafts) => ({ ...drafts, [book.id]: event.target.checked }))}
                  className="h-4 w-4 rounded border-input"
                />
                Share my page and progress with this group
              </label>
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
            {book.status === 'up_next' && !currentBook && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(book, 'current')} disabled={setStatus.isPending}>
                <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Start
              </Button>
            )}
            {book.status === 'current' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(book, 'completed')} disabled={setStatus.isPending}>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Finish
              </Button>
            )}
            {(book.status === 'completed' || book.status === 'archived') && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(book, 'up_next')} disabled={setStatus.isPending}>
                <Clock3 className="mr-1.5 h-3.5 w-3.5" /> Return to queue
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Remove ${book.title} from group reading list`}
              onClick={() => setRemoveTarget(book)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </article>
    );
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
            Shared reading
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Choose a book, read at your own pace, and share progress when you are comfortable.</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setShowBookPicker(true)} disabled={addBook.isPending}>
            <Plus className="mr-1.5 h-4 w-4" /> Add book
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        {isLoading ? (
          <div className="space-y-3" aria-label="Loading shared reading list">
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : error ? (
          <p role="alert" className="text-sm text-destructive">The shared reading list could not be loaded. Please refresh and try again.</p>
        ) : books.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
            <p className="font-medium text-foreground">No shared books yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {canManage ? 'Add your first title to start a shared reading journey.' : 'A group moderator can add the first title to this reading list.'}
            </p>
            {canManage && (
              <Button className="mt-3" variant="outline" size="sm" onClick={() => setShowBookPicker(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Add the first book
              </Button>
            )}
          </div>
        ) : (
          sections.filter((section) => section.items.length > 0).map((section) => (
            <section key={section.status} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <div className="space-y-3">{section.items.map(renderBook)}</div>
            </section>
          ))
        )}
      </CardContent>

      <BookSelectionModal
        isOpen={showBookPicker}
        onClose={() => setShowBookPicker(false)}
        onSelect={handleAddBook}
      />

      <AlertDialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this book?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget ? `“${removeTarget.title}” and its shared progress records will be removed from this group reading list.` : 'This book will be removed from the group reading list.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removeTarget) return;
                removeBook.mutate(
                  { groupId, readingBookId: removeTarget.id },
                  {
                    onSuccess: () => toast.success('Book removed from the group reading list.'),
                    onError: (mutationError) => toast.error(mutationError.message),
                  },
                );
                setRemoveTarget(null);
              }}
            >
              Remove book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default GroupReadingBoard;
