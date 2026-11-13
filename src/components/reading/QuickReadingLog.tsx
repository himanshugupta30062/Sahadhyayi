import React, { useState } from 'react';
import { BookOpen, NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreateReadingLog } from '@/hooks/useReadingLogs';
import { useSaveReadingProgress } from '@/hooks/useReadingProgress';

interface QuickReadingLogProps {
  bookId: string;
  bookTitle: string;
  coverImageUrl?: string;
  defaultOpen?: boolean;
}

const numberValue = (value: string) => value.trim() ? Number(value) : undefined;

export const QuickReadingLog = ({ bookId, bookTitle, coverImageUrl }: QuickReadingLogProps) => {
  const [open, setOpen] = useState(false);
  const [pagesRead, setPagesRead] = useState('');
  const [currentPage, setCurrentPage] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [minutesRead, setMinutesRead] = useState('');
  const [journalNote, setJournalNote] = useState('');
  const createLog = useCreateReadingLog();
  const saveProgress = useSaveReadingProgress();
  const { toast } = useToast();

  const reset = () => {
    setPagesRead('');
    setCurrentPage('');
    setTotalPages('');
    setMinutesRead('');
    setJournalNote('');
  };

  const submit = async () => {
    const pages = numberValue(pagesRead);
    const current = numberValue(currentPage);
    const total = numberValue(totalPages);
    const minutes = numberValue(minutesRead);
    if (current !== undefined && total !== undefined && current > total) {
      toast({ title: 'Check your page number', description: 'Current page cannot exceed total pages.', variant: 'destructive' });
      return;
    }
    try {
      await createLog.mutateAsync({
        bookId,
        pagesRead: pages,
        currentPage: current,
        totalPages: total,
        minutesRead: minutes,
        percentage: current !== undefined && total !== undefined ? Math.round((current / total) * 10000) / 100 : undefined,
        journalNote,
      });
      if (current !== undefined && total !== undefined) {
        await saveProgress.mutateAsync({ bookId, bookTitle, currentPage: current, totalPages: total, coverImageUrl });
      }
      toast({ title: 'Reading session saved', description: 'Your progress and private journal are updated.' });
      reset();
      setOpen(false);
    } catch (error) {
      toast({ title: 'Could not save reading session', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    }
  };

  const pending = createLog.isPending || saveProgress.isPending;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="shrink-0" aria-label={`Log reading for ${bookTitle}`}>
          <NotebookPen className="h-4 w-4 mr-1" /> Log
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Reading session</DialogTitle>
          <DialogDescription>Record today's reading for <strong>{bookTitle}</strong>. Journal notes stay private.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label htmlFor="log-pages">Pages read</Label><Input id="log-pages" type="number" min="1" step="1" inputMode="numeric" value={pagesRead} onChange={e => setPagesRead(e.target.value)} placeholder="e.g. 12" /></div>
          <div className="space-y-1"><Label htmlFor="log-minutes">Minutes read</Label><Input id="log-minutes" type="number" min="1" step="1" inputMode="numeric" value={minutesRead} onChange={e => setMinutesRead(e.target.value)} placeholder="e.g. 20" /></div>
          <div className="space-y-1"><Label htmlFor="log-current">Current page</Label><Input id="log-current" type="number" min="1" step="1" inputMode="numeric" value={currentPage} onChange={e => setCurrentPage(e.target.value)} placeholder="e.g. 42" /></div>
          <div className="space-y-1"><Label htmlFor="log-total">Total pages</Label><Input id="log-total" type="number" min="1" step="1" inputMode="numeric" value={totalPages} onChange={e => setTotalPages(e.target.value)} placeholder="e.g. 300" /></div>
        </div>
        <div className="space-y-1"><Label htmlFor="log-note">Private journal note</Label><Textarea id="log-note" value={journalNote} onChange={e => setJournalNote(e.target.value)} maxLength={5000} placeholder="A thought, quote, or reflection from today's reading…" rows={3} /><p className="text-xs text-muted-foreground text-right">{journalNote.length}/5000</p></div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => void submit()} disabled={pending}>{pending ? 'Saving…' : 'Save session'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickReadingLog;
