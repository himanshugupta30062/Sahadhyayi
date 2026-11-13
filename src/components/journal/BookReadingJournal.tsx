import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Highlighter,
  PenLine,
  Pencil,
  Save,
  X,
  Quote as QuoteIcon,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UnifiedJournalEntry, useReadingJournal } from '@/hooks/useReadingJournal';
import { useDeleteReaderHighlight } from '@/hooks/useReaderHighlights';
import { useDeleteMarginNote, useUpdateMarginNote } from '@/hooks/useMarginNotes';
import { useQuotes } from '@/contexts/quotesHelpers';
import { useToast } from '@/hooks/use-toast';

interface Props {
  bookId: string;
  bookTitle: string;
  currentPage?: number;
  onJumpToPage?: (page: number) => void;
  onAddReflection?: () => void;
}

export const BookReadingJournal: React.FC<Props> = ({
  bookId,
  bookTitle,
  currentPage,
  onJumpToPage,
  onAddReflection,
}) => {
  const { entries, bookSummaries, isLoading } = useReadingJournal(bookId);
  const deleteHighlight = useDeleteReaderHighlight();
  const deleteMarginNote = useDeleteMarginNote();
  const updateMarginNote = useUpdateMarginNote();
  const { removeQuote } = useQuotes();
  const { toast } = useToast();

  const [activeFilter, setActiveFilter] = useState<'all' | 'reflection' | 'highlight' | 'quote'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuote, setEditQuote] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editPage, setEditPage] = useState('1');

  const bookSummary = useMemo(() => bookSummaries.find((b) => b.bookId === bookId), [bookSummaries, bookId]);

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase();
    return entries.filter((entry) => {
      const matchesType = activeFilter === 'all' || entry.type === activeFilter;
      const searchable = [entry.text, entry.note, entry.bookTitle, String(entry.page)]
        .filter(Boolean).join(' ').toLocaleLowerCase();
      return matchesType && (!term || searchable.includes(term));
    });
  }, [entries, activeFilter, searchTerm]);

  const handleCopy = async (entry: UnifiedJournalEntry) => {
    const textToCopy = [
      entry.text ? `“${entry.text}”` : '',
      entry.note ? `Note: ${entry.note}` : '',
      `Page ${entry.page} — ${bookTitle}`,
    ].filter(Boolean).join('\n\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Unable to copy', description: 'Please copy this entry manually.' });
    }
  };

  const handleDelete = (entry: UnifiedJournalEntry) => {
    if (entry.type === 'reflection') {
      const raw = entry.rawItem as { id: string };
      if (window.confirm('Delete this private reflection permanently?')) {
        deleteMarginNote.mutate(raw.id, { onSuccess: () => toast({ title: 'Reflection deleted' }), onError: () => toast({ title: 'Could not delete reflection', variant: 'destructive' }) });
      }
    } else if (entry.type === 'highlight') {
      const raw = entry.rawItem as { id: string };
      deleteHighlight.mutate({ id: raw.id, bookId });
    } else if (entry.type === 'quote') {
      const raw = entry.rawItem as { id: number };
      removeQuote(raw.id);
    }
  };

  const startEdit = (entry: UnifiedJournalEntry) => {
    const raw = entry.rawItem as { id: string; quote?: string; note?: string; page?: number };
    setEditingId(raw.id);
    setEditQuote(raw.quote ?? entry.text ?? '');
    setEditNote(raw.note ?? entry.note ?? '');
    setEditPage(String(raw.page ?? entry.page));
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (!editingId || !editQuote.trim() || !editNote.trim()) {
      toast({ title: 'Quote and reflection are required', variant: 'destructive' });
      return;
    }
    const page = Number(editPage);
    if (!Number.isInteger(page) || page < 1) {
      toast({ title: 'Enter a valid page number', variant: 'destructive' });
      return;
    }
    try {
      await updateMarginNote.mutateAsync({ noteId: editingId, quote: editQuote, note: editNote, page });
      toast({ title: 'Reflection updated' });
      setEditingId(null);
    } catch {
      toast({ title: 'Could not update reflection', variant: 'destructive' });
    }
  };

  const getHighlightColorClass = (color?: string) => {
    switch (color) {
      case 'green': return 'bg-emerald-100/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-200';
      case 'blue': return 'bg-sky-100/80 border-sky-300 text-sky-900 dark:bg-sky-950/50 dark:border-sky-700 dark:text-sky-200';
      case 'pink': return 'bg-pink-100/80 border-pink-300 text-pink-900 dark:bg-pink-950/50 dark:border-pink-700 dark:text-pink-200';
      default: return 'bg-amber-100/80 border-amber-300 text-amber-900 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-200';
    }
  };

  const counts = {
    reflection: entries.filter((entry) => entry.type === 'reflection').length,
    highlight: entries.filter((entry) => entry.type === 'highlight').length,
    quote: entries.filter((entry) => entry.type === 'quote').length,
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/60 p-3.5 shadow-xs dark:border-amber-900/40 dark:from-amber-950/20 dark:via-background dark:to-orange-950/20">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="rounded-lg bg-amber-500/15 p-1.5 text-amber-700 dark:text-amber-300 shrink-0"><BookOpen className="h-4 w-4" /></div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold truncate text-foreground">{bookTitle}</h4>
              <p className="text-[11px] text-muted-foreground">
                {bookSummary && bookSummary.totalPages > 1
                  ? `Page ${bookSummary.currentPage} of ${bookSummary.totalPages} · ${bookSummary.progressPercent}% read`
                  : currentPage ? `Reading on Page ${currentPage}` : 'Personal Reading Journal'}
              </p>
            </div>
          </div>
          {onAddReflection && <Button size="sm" variant="outline" onClick={onAddReflection} className="h-7 gap-1 px-2 text-xs font-semibold text-amber-800 border-amber-300 bg-white hover:bg-amber-50 dark:bg-card dark:text-amber-300 shrink-0"><PenLine className="h-3 w-3" /><span>Add Reflection</span></Button>}
        </div>
        {bookSummary && bookSummary.totalPages > 1 && <Progress value={bookSummary.progressPercent} className="h-1.5 mb-2.5 bg-amber-200/50" />}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50 text-[11px]">
          <span className="font-semibold text-muted-foreground">Entries:</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{entries.length} total</Badge>
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-amber-700 border-amber-300">{counts.reflection} reflections</Badge>
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-emerald-700 border-emerald-300">{counts.highlight} highlights</Badge>
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-sky-700 border-sky-300">{counts.quote} quotes</Badge>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        <Button size="sm" variant={activeFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setActiveFilter('all')} className="h-7 text-xs px-2.5">All ({entries.length})</Button>
        <Button size="sm" variant={activeFilter === 'reflection' ? 'secondary' : 'ghost'} onClick={() => setActiveFilter('reflection')} className="h-7 text-xs px-2.5 gap-1"><PenLine className="h-3 w-3" />Reflections ({counts.reflection})</Button>
        <Button size="sm" variant={activeFilter === 'highlight' ? 'secondary' : 'ghost'} onClick={() => setActiveFilter('highlight')} className="h-7 text-xs px-2.5 gap-1"><Highlighter className="h-3 w-3" />Highlights ({counts.highlight})</Button>
        <Button size="sm" variant={activeFilter === 'quote' ? 'secondary' : 'ghost'} onClick={() => setActiveFilter('quote')} className="h-7 text-xs px-2.5 gap-1"><QuoteIcon className="h-3 w-3" />Quotes ({counts.quote})</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input aria-label="Search journal entries" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search notes, quotes, or page number…" className="pl-9" />
      </div>

      <div className="space-y-3">
        {isLoading ? <div className="py-8 text-center text-xs text-muted-foreground">Loading journal entries…</div> : filteredEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
            <PenLine className="mx-auto h-6 w-6 text-muted-foreground" />
            <h5 className="text-xs font-semibold text-foreground">{entries.length ? 'No matching entries' : 'No entries yet'}</h5>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              {entries.length ? 'Try another search term or clear your filters.' : 'Select text in the reader to save highlights, quotes, or private reflections. They will all sync together in your journal.'}
            </p>
          </div>
        ) : filteredEntries.map((entry) => (
          <Card key={entry.id} className={`border transition-all hover:shadow-xs ${entry.type === 'highlight' ? getHighlightColorClass(entry.color) : 'border-border/80 bg-card'}`}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold">Page {entry.page}</Badge>
                  <span className="text-[10px] uppercase font-semibold tracking-wider">{entry.type === 'reflection' ? 'Private Reflection' : entry.type === 'highlight' ? `Highlight (${entry.color || 'yellow'})` : 'Saved Quote'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => void handleCopy(entry)} className="h-6 w-6 text-muted-foreground hover:text-foreground" title="Copy entry">{copiedId === entry.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}</Button>
                  {entry.type === 'reflection' && <Button size="icon" variant="ghost" onClick={() => startEdit(entry)} className="h-6 w-6 text-muted-foreground hover:text-foreground" title="Edit private reflection"><Pencil className="h-3 w-3" /></Button>}
                  {(entry.type === 'reflection' || entry.type === 'highlight' || entry.type === 'quote') && <Button size="icon" variant="ghost" onClick={() => handleDelete(entry)} className="h-6 w-6 text-muted-foreground hover:text-destructive" title={entry.type === 'reflection' ? 'Delete private reflection' : 'Delete entry'}><Trash2 className="h-3 w-3" /></Button>}
                </div>
              </div>
              {entry.type === 'reflection' && editingId === (entry.rawItem as { id: string }).id ? (
                <div className="space-y-2 rounded-md border border-border/60 bg-background/60 p-2">
                  <label className="text-xs font-medium">Quoted passage</label>
                  <Textarea aria-label="Edit reflection quote" value={editQuote} onChange={(event) => setEditQuote(event.target.value)} rows={2} />
                  <label className="text-xs font-medium">Your reflection</label>
                  <Textarea aria-label="Edit reflection note" value={editNote} onChange={(event) => setEditNote(event.target.value)} rows={3} />
                  <label className="text-xs font-medium">Page</label>
                  <Input aria-label="Edit reflection page" type="number" min={1} value={editPage} onChange={(event) => setEditPage(event.target.value)} className="w-24" />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="mr-1 h-3 w-3" />Cancel</Button>
                    <Button size="sm" onClick={() => void saveEdit()} disabled={updateMarginNote.isPending}><Save className="mr-1 h-3 w-3" />Save</Button>
                  </div>
                </div>
              ) : (
                <>
                  {entry.text && <p className="text-xs italic leading-relaxed text-foreground/90 font-serif whitespace-pre-wrap">“{entry.text}”</p>}
                  {entry.note && <div className="rounded-md border border-border/60 bg-background/60 p-2 text-xs text-foreground"><p className="font-sans whitespace-pre-wrap">{entry.note}</p></div>}
                </>
              )}
              <div className="flex justify-end pt-1">
                {onJumpToPage ? <button type="button" onClick={() => onJumpToPage(entry.page)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"><span>Jump to Page {entry.page}</span><ExternalLink className="h-3 w-3" /></button> : <Link to={`/reader/${bookId}?page=${entry.page}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"><span>Open in Reader (p. {entry.page})</span><ExternalLink className="h-3 w-3" /></Link>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default BookReadingJournal;
