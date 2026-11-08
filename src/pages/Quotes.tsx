import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen,
  Bookmark,
  Check,
  Copy,
  ExternalLink,
  Highlighter,
  PenLine,
  Plus,
  Quote as QuoteIcon,
  Search,
  Share2,
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
import { CURATED_LITERARY_QUOTES, type CuratedQuote } from '@/data/curatedQuotes';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Categories',
  wisdom: 'Wisdom & Life',
  literature: 'Literature & Books',
  philosophy: 'Philosophy',
  poetry: 'Poetry & Ghazals',
  courage: 'Courage & Freedom',
};

const QuotesPage = () => {
  const location = useLocation();
  const isJournalRoute = location.pathname.startsWith('/journal');
  const isQuotesRoute = location.pathname.startsWith('/quotes');

  const [activeTab, setActiveTab] = useState<string>(isQuotesRoute ? 'quotes' : 'journal');
  const [selectedBookId, setSelectedBookId] = useState<string>('all');
  const [quoteSubView, setQuoteSubView] = useState<'all' | 'saved' | 'curated'>('all');
  const [curatedCategory, setCuratedCategory] = useState<string>('all');
  const [curatedSearch, setCuratedSearch] = useState<string>('');
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | number | null>(null);

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

  const handleSaveCuratedQuote = (q: CuratedQuote) => {
    addQuote(q.text, `${q.author} — ${q.work}`);
    toast({
      title: 'Saved to Your Quotes',
      description: `“${q.text.slice(0, 48)}…” added to your personal quotes.`,
    });
  };

  const handleCopyQuote = (id: string | number, text: string, attribution: string) => {
    const formatted = `“${text}”\n— ${attribution} (via Sahadhyayi)`;
    void navigator.clipboard.writeText(formatted).then(() => {
      setCopiedQuoteId(id);
      toast({ title: 'Quote copied to clipboard' });
      setTimeout(() => setCopiedQuoteId(null), 2500);
    }).catch(() => {
      toast({ title: 'Unable to copy', description: 'Please copy manually.' });
    });
  };

  const shareQuote = (text: string, attribution?: string) => {
    toast({
      title: 'Quote Shared',
      description: attribution ? `“${text.slice(0, 40)}…” (${attribution}) shared to feed!` : 'Your quote was shared to the community feed!',
    });
  };

  const selectedSummary = useMemo(() => {
    if (selectedBookId === 'all') return null;
    return bookSummaries.find((b) => b.bookId === selectedBookId) || null;
  }, [bookSummaries, selectedBookId]);

  const filteredCuratedQuotes = useMemo(() => {
    return CURATED_LITERARY_QUOTES.filter((q) => {
      const matchCat = curatedCategory === 'all' || q.category === curatedCategory;
      const term = curatedSearch.trim().toLowerCase();
      const matchTerm =
        !term ||
        q.text.toLowerCase().includes(term) ||
        q.author.toLowerCase().includes(term) ||
        q.work.toLowerCase().includes(term) ||
        q.tags.some((t) => t.toLowerCase().includes(term));
      return matchCat && matchTerm;
    });
  }, [curatedCategory, curatedSearch]);

  return (
    <>
      <SEO
        title={isQuotesRoute ? "Quotes & Literary Reflections — Sahadhyayi" : "Personal Reading Journal & Highlights — Sahadhyayi"}
        description={
          isQuotesRoute
            ? "Discover timeless literary quotes, save memorable lines from your reading, and explore reflections from Tagore, Premchand, Ghalib, and world masters."
            : "Your personal reading journal: private reflections, persistent highlights, saved quotes, and book-by-book reading progress."
        }
        canonical={isQuotesRoute ? "https://sahadhyayi.com/quotes" : "https://sahadhyayi.com/journal"}
        url={isQuotesRoute ? "https://sahadhyayi.com/quotes" : "https://sahadhyayi.com/journal"}
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
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1.5 font-serif">
                  {isQuotesRoute ? 'Literary Quotes & Saved Lines' : 'Reading Journal & Highlights'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Discover timeless quotes from world masters, save your favorite lines while reading, and organize personal reflections.
                </p>
              </div>

              {/* Book Selector (only when book summaries exist) */}
              {bookSummaries.length > 0 && activeTab === 'journal' && (
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
              <TabsTrigger value="quotes" className="gap-1.5 text-xs font-semibold">
                <QuoteIcon className="h-3.5 w-3.5" />
                <span>Quotes ({quotes.length})</span>
              </TabsTrigger>
              <TabsTrigger value="journal" className="gap-1.5 text-xs font-semibold">
                <PenLine className="h-3.5 w-3.5" />
                <span>Journal</span>
              </TabsTrigger>
              <TabsTrigger value="highlights" className="gap-1.5 text-xs font-semibold">
                <Highlighter className="h-3.5 w-3.5" />
                <span>Highlights ({highlights.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: SAVED & CURATED QUOTES */}
            <TabsContent value="quotes" className="space-y-6">
              {/* Add Custom Quote Box */}
              <Card className="border border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <QuoteIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Save a Quote to Your Library</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Enter an inspiring quote or memorable line…"
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    className="min-h-[72px]"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Author or Book title"
                      value={quoteSource}
                      onChange={(e) => setQuoteSource(e.target.value)}
                    />
                    <Input
                      placeholder="Page or location (optional)"
                      value={quotePage}
                      onChange={(e) => setQuotePage(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddQuote} className="w-full bg-[#1C442D] hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c9a35a] text-white">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Save to My Quotes
                  </Button>
                </CardContent>
              </Card>

              {/* View Selector: All / My Saved / Classic Curated */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant={quoteSubView === 'all' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs font-medium"
                    onClick={() => setQuoteSubView('all')}
                  >
                    All Quotes ({quotes.length + filteredCuratedQuotes.length})
                  </Button>
                  <Button
                    variant={quoteSubView === 'saved' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs font-medium"
                    onClick={() => setQuoteSubView('saved')}
                  >
                    My Saved ({quotes.length})
                  </Button>
                  <Button
                    variant={quoteSubView === 'curated' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs font-medium"
                    onClick={() => setQuoteSubView('curated')}
                  >
                    Classic Literature ({CURATED_LITERARY_QUOTES.length})
                  </Button>
                </div>

                {/* Search */}
                <div className="relative sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search quotes, authors…"
                    value={curatedSearch}
                    onChange={(e) => setCuratedSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-card"
                  />
                </div>
              </div>

              {/* SECTION: USER'S PERSONAL SAVED QUOTES */}
              {(quoteSubView === 'all' || quoteSubView === 'saved') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D]" />
                      <span>My Saved Quotes ({quotes.length})</span>
                    </h2>
                  </div>

                  {quotes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-amber-300/80 bg-amber-50/40 p-6 text-center dark:border-amber-900/40 dark:bg-amber-950/10">
                      <p className="text-sm font-medium text-foreground">You haven't saved any personal quotes yet.</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        Add your favorite passages using the box above, save quotes while reading in the reader, or explore the classic literary quotes below and click "Save to Quotes".
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {quotes.map((q) => (
                        <Card key={q.id} className="border-border/80 shadow-2xs hover:shadow-xs transition-shadow">
                          <CardContent className="p-4 space-y-2">
                            <p className="text-sm sm:text-base font-serif italic text-foreground leading-relaxed">“{q.text}”</p>
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                              <div>
                                {q.source && <span className="font-semibold text-foreground">— {q.source}</span>}
                                {(q.page || q.location) && (
                                  <span className="ml-2 text-muted-foreground">
                                    ({q.page ? `Page ${q.page}` : 'Reading location'})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleCopyQuote(q.id, q.text, q.source || 'Sahadhyayi Reader')}
                                >
                                  {copiedQuoteId === q.id ? <Check className="h-3 w-3 text-emerald-500 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                  {copiedQuoteId === q.id ? 'Copied' : 'Copy'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => shareQuote(q.text, q.source)}
                                >
                                  <Share2 className="h-3 w-3 mr-1" />
                                  Share
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                                  onClick={() => removeQuote(q.id)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: CLASSIC CURATED LITERARY QUOTES */}
              {(quoteSubView === 'all' || quoteSubView === 'curated') && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#D5B16D]" />
                        <span>Classic Literary Quotes & Reflections</span>
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Selected timeless lines from world masters and Indian literature.
                      </p>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                        <button
                          key={catKey}
                          onClick={() => setCuratedCategory(catKey)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            curatedCategory === catKey
                              ? 'bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C]'
                              : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCuratedQuotes.map((q) => (
                      <Card key={q.id} className="border-border bg-card/80 hover:border-amber-400/60 dark:hover:border-amber-600/40 transition-all flex flex-col justify-between">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800">
                              {q.category}
                            </Badge>
                            {q.language && (
                              <span className="text-[10px] text-muted-foreground">{q.language}</span>
                            )}
                          </div>

                          <p className="text-sm sm:text-base font-serif italic text-foreground leading-relaxed">
                            “{q.text}”
                          </p>

                          <div className="space-y-1">
                            <p className="text-xs font-bold text-foreground">{q.author}</p>
                            <p className="text-xs text-muted-foreground">{q.work}</p>
                          </div>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {q.tags.map((tag) => (
                              <span key={tag} className="text-[10px] bg-muted/60 text-muted-foreground rounded px-1.5 py-0.5">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-border/40">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-amber-300 dark:border-amber-800 text-foreground hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              onClick={() => handleSaveCuratedQuote(q)}
                            >
                              <Bookmark className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              Save to Quotes
                            </Button>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleCopyQuote(q.id, q.text, `${q.author}, ${q.work}`)}
                              >
                                {copiedQuoteId === q.id ? <Check className="h-3 w-3 text-emerald-500 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                {copiedQuoteId === q.id ? 'Copied' : 'Copy'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => shareQuote(q.text, `${q.author}, ${q.work}`)}
                              >
                                <Share2 className="h-3 w-3 mr-1" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: UNIFIED READING JOURNAL */}
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

            {/* TAB 3: ALL HIGHLIGHTS */}
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
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default QuotesPage;
