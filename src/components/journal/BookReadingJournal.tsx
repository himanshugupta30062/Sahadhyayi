import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Highlighter,
  PenLine,
  Quote as QuoteIcon,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UnifiedJournalEntry, useReadingJournal } from '@/hooks/useReadingJournal';
import { useDeleteReaderHighlight } from '@/hooks/useReaderHighlights';
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
  const { removeQuote } = useQuotes();
  const { toast } = useToast();

  const [activeFilter, setActiveFilter] = useState<'all' | 'reflection' | 'highlight' | 'quote'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'recent' | 'page'>('recent');

  const bookSummary = useMemo(() => {
    return bookSummaries.find((b) => b.bookId === bookId);
  }, [bookSummaries, bookId]);

  const filteredEntries = useMemo(() => {
    const matching = activeFilter === 'all' ? entries : entries.filter((e) => e.type === activeFilter);
    return [...matching].sort((a, b) =>
      sortOrder === 'page'
        ? a.page - b.page || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [entries, activeFilter, sortOrder]);

  const handleCopy = async (entry: UnifiedJournalEntry) => {
    const textToCopy = [
      entry.text ? `“${entry.text}”` : '',
      entry.note ? `Note: ${entry.note}` : '',
      `Page ${entry.page} — ${bookTitle}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: 'Copied to clipboard' });
    } catch {
      // Ignore
    }
  };

  const handleDelete = (entry: UnifiedJournalEntry) => {
    if (entry.type === 'highlight') {
      const raw = entry.rawItem as { id: string };
      deleteHighlight.mutate({ id: raw.id, bookId });
    } else if (entry.type === 'quote') {
      const raw = entry.rawItem as { id: number };
      removeQuote(raw.id);
    }
  };

  const getHighlightColorClass = (color?: string) => {
    switch (color) {
      case 'green':
        return 'bg-emerald-100/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-200';
      case 'blue':
        return 'bg-sky-100/80 border-sky-300 text-sky-900 dark:bg-sky-950/50 dark:border-sky-700 dark:text-sky-200';
      case 'pink':
        return 'bg-pink-100/80 border-pink-300 text-pink-900 dark:bg-pink-950/50 dark:border-pink-700 dark:text-pink-200';
      default:
        return 'bg-amber-100/80 border-amber-300 text-amber-900 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Book Reading Summary Header */}
      <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/60 p-3.5 shadow-xs dark:border-amber-900/40 dark:from-amber-950/20 dark:via-background dark:to-orange-950/20">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="rounded-lg bg-amber-500/15 p-1.5 text-amber-700 dark:text-amber-300 shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold truncate text-foreground">{bookTitle}</h4>
              <p className="text-[11px] text-muted-foreground">
                {bookSummary && bookSummary.totalPages > 1
                  ? `Page ${bookSummary.currentPage} of ${bookSummary.totalPages} · ${bookSummary.progressPercent}% read`
                  : currentPage
                  ? `Reading on Page ${currentPage}`
                  : 'Personal Reading Journal'}
              </p>
            </div>
          </div>

          {onAddReflection && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAddReflection}
              className="h-7 gap-1 px-2 text-xs font-semibold text-amber-800 border-amber-300 bg-white hover:bg-amber-50 dark:bg-card dark:text-amber-300 shrink-0"
            >
              <PenLine className="h-3 w-3" />
              <span>Add Reflection</span>
            </Button>
          )}
        </div>

        {bookSummary && bookSummary.totalPages > 1 && (
          <Progress value={bookSummary.progressPercent} className="h-1.5 mb-2.5 bg-amber-200/50" />
        )}

        {/* Counter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50 text-[11px]">
          <span className="font-semibold text-muted-foreground">Entries:</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {entries.length} total
          </Badge>
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-amber-700 border-amber-300">
            {entries.filter((e) => e.type === 'reflection').length} reflections
          </Badge>
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-emerald-700 border-emerald-300">
            {entries.filter((e) => e.type === 'highlight').length} highlights
          </Badge>
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-sky-700 border-sky-300">
            {entries.filter((e) => e.type === 'quote').length} quotes
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        <Button
          size="sm"
          variant={activeFilter === 'all' ? 'secondary' : 'ghost'}
          onClick={() => setActiveFilter('all')}
          className="h-7 text-xs px-2.5"
        >
          All ({entries.length})
        </Button>
        <Button
          size="sm"
          variant={activeFilter === 'reflection' ? 'secondary' : 'ghost'}
          onClick={() => setActiveFilter('reflection')}
          className="h-7 text-xs px-2.5 gap-1"
        >
          <PenLine className="h-3 w-3" />
          Reflections ({entries.filter((e) => e.type === 'reflection').length})
        </Button>
        <Button
          size="sm"
          variant={activeFilter === 'highlight' ? 'secondary' : 'ghost'}
          onClick={() => setActiveFilter('highlight')}
          className="h-7 text-xs px-2.5 gap-1"
        >
          <Highlighter className="h-3 w-3" />
          Highlights ({entries.filter((e) => e.type === 'highlight').length})
        </Button>
        <Button
          size="sm"
          variant={activeFilter === 'quote' ? 'secondary' : 'ghost'}
          onClick={() => setActiveFilter('quote')}
          className="h-7 text-xs px-2.5 gap-1"
        >
          <QuoteIcon className="h-3 w-3" />
          Quotes ({entries.filter((e) => e.type === 'quote').length})
        </Button>
      </div>

      {/* Entries List */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}</span>
        <div className="flex items-center gap-1" role="group" aria-label="Sort journal entries">
          <Button size="sm" variant={sortOrder === 'recent' ? 'secondary' : 'ghost'} onClick={() => setSortOrder('recent')} className="h-7 px-2 text-xs">Newest</Button>
          <Button size="sm" variant={sortOrder === 'page' ? 'secondary' : 'ghost'} onClick={() => setSortOrder('page')} className="h-7 px-2 text-xs">Page order</Button>
        </div>
      </div>
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Loading journal entries…</div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
            <PenLine className="mx-auto h-6 w-6 text-muted-foreground" />
            <h5 className="text-xs font-semibold text-foreground">No entries yet</h5>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Select text in the reader to save highlights, quotes, or private reflections. They will all sync together in your journal.
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              className={`border transition-all hover:shadow-xs ${
                entry.type === 'highlight'
                  ? getHighlightColorClass(entry.color)
                  : 'border-border/80 bg-card'
              }`}
            >
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold">
                      Page {entry.page}
                    </Badge>
                    <span className="text-[10px] uppercase font-semibold tracking-wider">
                      {entry.type === 'reflection'
                        ? 'Private Reflection'
                        : entry.type === 'highlight'
                        ? `Highlight (${entry.color || 'yellow'})`
                        : 'Saved Quote'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopy(entry)}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      title="Copy entry"
                    >
                      {copiedId === entry.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </Button>

                    {(entry.type === 'highlight' || entry.type === 'quote') && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(entry)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        title="Delete entry"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground">{Number.isNaN(new Date(entry.createdAt).getTime()) ? '' : new Date(entry.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>

                {/* Quote / Highlight Text */}
                {entry.text && (
                  <p className="text-xs italic leading-relaxed text-foreground/90 font-serif whitespace-pre-wrap">
                    “{entry.text}”
                  </p>
                )}

                {/* Personal Note */}
                {entry.note && (
                  <div className="rounded-md border border-border/60 bg-background/60 p-2 text-xs text-foreground">
                    <p className="font-sans whitespace-pre-wrap">{entry.note}</p>
                  </div>
                )}

                {/* Jump to Page Link */}
                <div className="flex justify-end pt-1">
                  {onJumpToPage ? (
                    <button
                      type="button"
                      onClick={() => onJumpToPage(entry.page)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"
                    >
                      <span>Jump to Page {entry.page}</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  ) : (
                    <Link
                      to={`/reader/${bookId}?page=${entry.page}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"
                    >
                      <span>Open in Reader (p. {entry.page})</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
export default BookReadingJournal;

