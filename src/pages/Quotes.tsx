import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen,
  Bookmark,
  ExternalLink,
  Highlighter,
  PenLine,
  Plus,
  Quote as QuoteIcon,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SEO from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';
import { useQuotes } from '@/contexts/quotesHelpers';
import { useReaderHighlights, useDeleteReaderHighlight } from '@/hooks/useReaderHighlights';
import { useReadingJournal } from '@/hooks/useReadingJournal';
import BookReadingJournal from '@/components/journal/BookReadingJournal';

const QuotesPage = () => {
  const location = useLocation();
  const isJournalRoute = location.pathname.startsWith('/journal');

  const [activeTab, setActiveTab] = useState<string>(isJournalRoute ? 'journal' : 'journal');
  const [selectedBookId, setSelectedBookId] = useState<string>('all');

  const { quotes, addQuote, removeQuote } = useQuotes();
  const { data: highlights = [], isLoading: highlightsLoading } = useReaderHighlights();
  const deleteHighlight = useDeleteReaderHighlight();
  const { bookSummaries, entries } = useReadingJournal();
  const { toast } = useToast();

  const [quoteText, setQuoteText] = useState('');
  const [quoteSource, setQuoteSource] = useState('');
  const [quotePage, setQuotePage] = useState('');

  const handleAddQuote = () => {
    if (!quoteText.trim()) return;
    const pageNum = parseInt(quotePage.trim(), 10);
    addQuote(quoteText, quoteSource, undefined, {
      page: !isNaN(pageNum) ? pageNum : undefined,
    });
    setQuoteText('');
    setQuoteSource('');
    setQuotePage('');
    toast({ title: 'Quote saved to your personal library' });
  };

  const shareQuote = (text: string) => {
    toast({
      title: 'Quote Shared',
      description: 'Your quote was shared to the community feed!',
    });
  };

  const selectedSummary = useMemo(() => {
    if (selectedBookId === 'all') return null;
    return bookSummaries.find((b) => b.bookId === selectedBookId) || null;
  }, [bookSummaries, selectedBookId]);

  return (
    <>
      <SEO
        title="Personal Reading Journal & Highlights - Sahadhyayi"
        description="Your personal reading journal: private reflections, persistent highlights, saved quotes, and book-by-book reading progress."
        canonical="https://sahadhyayi.com/journal"
        url="https://sahadhyayi.com/journal"
      />
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/60 p-6 shadow-xs dark:border-amber-900/40 dark:from-amber-950/20 dark:via-background dark:to-orange-950/20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white/90 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  <Bookmark className="h-3.5 w-3.5 text-amber-600" />
                  Personal Reading Dossier
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1.5">
                  Reading Journal & Highlights
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Private margin reflections, highlights, memorable quotes, and book progress in one place.
                </p>
              </div>

              {/* Book Selector */}
              {bookSummaries.length > 0 && (
                <div className="sm:w-64 pt-2 sm:pt-0">
                  <label htmlFor="select-book-journal" className="text-xs font-semibold uppercase text-muted-foreground block mb-1">
                    Filter by Book:
                  </label>
                  <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                    <SelectTrigger id="select-book-journal" className="h-9 bg-white dark:bg-card">
                      <SelectValue placeholder="All Books" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Books ({entries.length} entries)</SelectItem>
                      {bookSummaries.map((b) => (
                        <SelectItem key={b.bookId} value={b.bookId}>
                          {b.bookTitle} ({b.totalEntriesCount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 max-w-md bg-muted/60">
              <TabsTrigger value="journal" className="gap-1.5 text-xs font-semibold">
                <PenLine className="h-3.5 w-3.5" />
                <span>Journal</span>
              </TabsTrigger>
              <TabsTrigger value="highlights" className="gap-1.5 text-xs font-semibold">
                <Highlighter className="h-3.5 w-3.5" />
                <span>Highlights ({highlights.length})</span>
              </TabsTrigger>
              <TabsTrigger value="quotes" className="gap-1.5 text-xs font-semibold">
                <QuoteIcon className="h-3.5 w-3.5" />
                <span>Quotes ({quotes.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: UNIFIED READING JOURNAL */}
            <TabsContent value="journal" className="space-y-4">
              {selectedBookId !== 'all' && selectedSummary ? (
                <BookReadingJournal
                  bookId={selectedSummary.bookId}
                  bookTitle={selectedSummary.bookTitle}
                  currentPage={selectedSummary.currentPage}
                />
              ) : (
                <div className="space-y-4">
                  {bookSummaries.length === 0 ? (
                    <Card className="border-dashed border-2 border-border p-8 text-center space-y-2">
                      <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                      <h3 className="text-base font-semibold text-foreground">Your journal is ready</h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        As you read books on Sahadhyayi, select text to save highlights, quotes, or personal reflections. They will be organized automatically into your reading journal.
                      </p>
                    </Card>
                  ) : (
                    bookSummaries.map((summary) => (
                      <BookReadingJournal
                        key={summary.bookId}
                        bookId={summary.bookId}
                        bookTitle={summary.bookTitle}
                        currentPage={summary.currentPage}
                      />
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: ALL HIGHLIGHTS */}
            <TabsContent value="highlights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">All Saved Highlights ({highlights.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {highlightsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading highlights…</p>
                  ) : highlights.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Highlights you save while reading will appear here. Select text in any book and tap "Save Highlight".
                    </p>
                  ) : (
                    highlights.map((h) => (
                      <div key={h.id} className="rounded-lg border border-border p-3 space-y-2 bg-card">
                        <p className="text-sm italic font-serif leading-relaxed whitespace-pre-wrap">“{h.text}”</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            Page {h.page} · {h.color}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => window.location.assign(`/reader/${h.book_id}?page=${h.page}`)}
                            >
                              Open in Reader
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => deleteHighlight.mutate({ id: h.id, bookId: h.book_id })}
                              disabled={deleteHighlight.isPending}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: SAVED QUOTES */}
            <TabsContent value="quotes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Save a Quote</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Enter an inspiring quote…"
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Book or author"
                      value={quoteSource}
                      onChange={(e) => setQuoteSource(e.target.value)}
                    />
                    <Input
                      placeholder="Page number (optional)"
                      value={quotePage}
                      onChange={(e) => setQuotePage(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddQuote} className="w-full">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Save to Quotes
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {quotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No quotes saved yet. Add one above or save quotes directly from books while reading.
                  </p>
                ) : (
                  quotes.map((q) => (
                    <Card key={q.id}>
                      <CardContent className="p-4 space-y-2">
                        <p className="text-sm font-serif italic text-foreground">“{q.text}”</p>
                        {q.source && <p className="text-xs text-muted-foreground">— {q.source}</p>}
                        {(q.page || q.location) && (
                          <p className="text-xs text-muted-foreground">
                            {q.page ? `Page ${q.page}` : 'Reading location'}
                            {q.location ? ` · ${q.location.slice(0, 28)}` : ''}
                          </p>
                        )}
                        <div className="flex justify-end gap-2 pt-1 border-t border-border/50">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => shareQuote(q.text)}>
                            Share
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => removeQuote(q.id)}>
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default QuotesPage;
