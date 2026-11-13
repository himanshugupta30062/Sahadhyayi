import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SEO from '@/components/SEO';
import { trackUiEvent } from '@/lib/analytics';
import { useAllLibraryBooks } from '@/hooks/useLibraryBooks';
import { useBookRecommendations } from '@/hooks/useBookRecommendations';
import { useAddToBookshelf, useUserBookshelf } from '@/hooks/useUserBookshelf';
import { rankPersonalizedBooks } from '@/utils/personalizedBookRecommendations';
import { useAuth } from '@/contexts/authHelpers';
import { BookOpen, Plus, Search, Sparkles, RotateCcw, BookmarkCheck } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import SemanticBookDiscovery from '@/components/discovery/SemanticBookDiscovery';

const Discovery = () => {
  const { user } = useAuth();
  const { data: books = [], isLoading, isError } = useAllLibraryBooks();
  const { data: recommendations = [] } = useBookRecommendations(user?.id);
  const { data: shelf = [] } = useUserBookshelf();
  const personalized = useMemo(() => rankPersonalizedBooks(books, shelf, 8), [books, shelf]);
  const addToShelf = useAddToBookshelf();
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [lengthFilter, setLengthFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'title_asc'>('relevance');
  const [readingMood, setReadingMood] = useState<string | null>(null);
  const moodPresets = [
    { id: 'comfort', label: '☕ Comfort & cozy', terms: ['fiction', 'romance', 'poetry', 'classic'] },
    { id: 'curious', label: '🧠 Learn something', terms: ['science', 'history', 'philosophy', 'non-fiction', 'education'] },
    { id: 'adventure', label: '🗺️ Adventure', terms: ['adventure', 'fantasy', 'travel', 'thriller', 'mystery'] },
    { id: 'reflect', label: '🌙 Reflect & unwind', terms: ['poetry', 'philosophy', 'spiritual', 'self-help', 'memoir'] },
    { id: 'inspire', label: '✨ Feel inspired', terms: ['biography', 'motivation', 'self-help', 'business', 'inspiration'] },
  ];

  const filteredTrendingBooks = useMemo(() => {
    let list = [...books];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.genre?.toLowerCase().includes(query)
      );
    }

    if (languageFilter !== 'all') list = list.filter((book) => book.language === languageFilter);
    if (genreFilter !== 'all') list = list.filter((book) => book.genre === genreFilter);
    if (availabilityFilter === 'readable') list = list.filter((book) => Boolean(book.pdf_url));
    if (lengthFilter === 'short') list = list.filter((book) => book.pages && book.pages <= 200);
    if (lengthFilter === 'medium') list = list.filter((book) => book.pages && book.pages > 200 && book.pages <= 400);
    if (lengthFilter === 'long') list = list.filter((book) => book.pages && book.pages > 400);
    if (readingMood) {
      const mood = moodPresets.find((preset) => preset.id === readingMood);
      if (mood) list = list.filter((book) => mood.terms.some((term) => `${book.genre || ''} ${book.title || ''} ${book.description || ''}`.toLowerCase().includes(term)));
    }

    if (sortBy === 'newest') list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sortBy === 'title_asc') list.sort((a, b) => a.title.localeCompare(b.title));

    return list.slice(0, 24);
  }, [availabilityFilter, books, genreFilter, languageFilter, lengthFilter, searchQuery, sortBy, readingMood]);

  const genres = useMemo(
    () => [...new Set(books.map((book) => book.genre).filter(Boolean))].sort((a, b) => (a ?? '').localeCompare(b ?? '')),
    [books],
  );
  const hasActiveFilters = Boolean(searchQuery.trim()) || languageFilter !== 'all' || genreFilter !== 'all' || availabilityFilter !== 'all' || lengthFilter !== 'all' || sortBy !== 'relevance' || readingMood !== null;
  const clearFilters = () => {
    setSearchQuery('');
    setLanguageFilter('all');
    setGenreFilter('all');
    setAvailabilityFilter('all');
    setLengthFilter('all');
    setSortBy('relevance');
    setReadingMood(null);
    void trackUiEvent('discovery_filters_reset');
  };

  const languages = useMemo(
    () => [...new Set(books.map((book) => book.language).filter(Boolean))].sort((a, b) => (a ?? '').localeCompare(b ?? '')),
    [books],
  );

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <SEO
        title="Book Discovery"
        description="Discover books from the Sahadhyayi library with personalized recommendations and reader-friendly filters."
        url="https://sahadhyayi.com/discovery"
      />
      <h1 className="text-3xl font-bold mb-6 text-center">Discover New Books</h1>

      <div className="mb-10">
        <SemanticBookDiscovery />
      </div>

      <Card className="mb-8 border-border">
        <CardContent className="pt-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Input
              placeholder="Search by title, author, or keyword"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                void trackUiEvent('discovery_filter_changed', { filter: 'search' });
              }}
            />
            <Select value={sortBy} onValueChange={(value: 'relevance' | 'newest' | 'title_asc') => {
              setSortBy(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'sort', value });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Sort: Relevance</SelectItem>
                <SelectItem value="newest">Sort: Newest added</SelectItem>
                <SelectItem value="title_asc">Sort: Title A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={(value) => {
              setAvailabilityFilter(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'availability', value });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All availability</SelectItem>
                <SelectItem value="readable">Readable online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">What are you in the mood to read?</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Reading mood">
              {moodPresets.map((mood) => (
                <Button key={mood.id} type="button" size="sm" variant={readingMood === mood.id ? 'default' : 'outline'} aria-pressed={readingMood === mood.id}
                  onClick={() => {
                    setReadingMood(readingMood === mood.id ? null : mood.id);
                    void trackUiEvent('discovery_filter_changed', { filter: 'reading_mood', value: readingMood === mood.id ? 'all' : mood.id });
                  }}>
                  {mood.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Choose a vibe to narrow the library—or tap it again to show every book.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <Select value={languageFilter} onValueChange={(value) => {
              setLanguageFilter(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'language', value });
            }}>
              <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {languages.map((language) => <SelectItem key={language} value={language}>{language}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={genreFilter} onValueChange={(value) => {
              setGenreFilter(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'genre', value });
            }}>
              <SelectTrigger><SelectValue placeholder="Genre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genres</SelectItem>
                {genres.map((genre) => <SelectItem key={genre} value={genre}>{genre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={lengthFilter} onValueChange={(value) => {
              setLengthFilter(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'book_length', value });
            }}>
              <SelectTrigger><SelectValue placeholder="Book length" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any length</SelectItem>
                <SelectItem value="short">Short · up to 200 pages</SelectItem>
                <SelectItem value="medium">Medium · 201–400 pages</SelectItem>
                <SelectItem value="long">Long · 400+ pages</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && <div className="flex justify-end"><Button type="button" variant="ghost" size="sm" onClick={clearFilters}><RotateCcw className="w-4 h-4 mr-2" />Clear filters</Button></div>}
        </CardContent>
      </Card>

      {user && personalized.length > 0 && (
        <section className="mb-10" aria-labelledby="personalized-heading">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <h2 id="personalized-heading" className="text-2xl font-semibold">Picked for your reading taste</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Suggestions shaped by books you are reading or have completed, including your ratings.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {personalized.slice(0, 4).map((book) => (
              <Link key={book.id} to={`/book/${book.id}`} className="block">
                <Card className="h-full border-border hover:border-brand-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <p className="text-xs text-brand-primary font-medium mb-2">{book.reason}</p>
                    <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{book.author || 'Unknown author'}</p>
                    {book.genre && <Badge variant="outline" className="mt-2">{book.genre}</Badge>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {user && recommendations.length > 0 && (
        <section className="mb-10" aria-labelledby="recommended-heading">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <h2 id="recommended-heading" className="text-2xl font-semibold">Recommended for you</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.slice(0, 4).map((book) => (
              <Card key={book.id} className="h-full border-border hover:border-brand-primary/50 transition-colors">
                <CardContent className="p-4 flex flex-col h-full">
                  <Link to={`/book/${book.id}`} className="group">
                    <div className="flex items-center gap-1.5 text-xs text-brand-primary font-medium mb-2"><Sparkles className="w-3.5 h-3.5" /> Picked from your bookshelf activity</div>
                    <h3 className="font-semibold line-clamp-2 group-hover:text-brand-primary">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{book.author || 'Unknown author'}</p>
                    {book.genre && <Badge variant="outline" className="mt-2 text-xs">{book.genre}</Badge>}
                  </Link>
                  <div className="mt-auto pt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" asChild><Link to={`/book/${book.id}`}>Details</Link></Button>
                    <Button size="sm" variant="ghost" className="flex-1 text-brand-primary" disabled={addToShelf.isPending} onClick={() => addToShelf.mutate({ bookId: book.id, status: 'want_to_read' })}><BookmarkCheck className="w-4 h-4 mr-1" /> Save</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Explore the library</h2>
        {isLoading && <div className="flex justify-center py-16"><LoadingSpinner /></div>}
        {isError && <p className="text-center text-destructive py-12">Books could not be loaded. Please try again.</p>}
        {!isLoading && !isError && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrendingBooks.map((book) => (
            <Card key={book.id} className="border-border overflow-hidden">
              <CardContent className="p-4 flex gap-4">
                <Link to={`/book/${book.id}`} className="w-20 h-28 bg-muted rounded overflow-hidden shrink-0 flex items-center justify-center">
                  {book.cover_image_url ? <img src={book.cover_image_url} alt="" loading="lazy" className="w-full h-full object-cover" /> : <BookOpen className="w-7 h-7 text-muted-foreground" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/book/${book.id}`} onClick={() => void trackUiEvent('discovery_book_opened', { bookId: book.id })}>
                    <h3 className="font-semibold line-clamp-2 hover:text-brand-primary">{book.title}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground truncate mt-1">{book.author}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {book.genre && <Badge variant="outline" className="text-xs">{book.genre}</Badge>}
                    {book.pdf_url && <Badge variant="secondary" className="text-xs">Read online</Badge>}
                  </div>
                  {user ? (
                    <Button size="sm" variant="ghost" className="mt-2 px-0 text-brand-primary" disabled={addToShelf.isPending} onClick={() => addToShelf.mutate({ bookId: book.id, status: 'want_to_read' })}>
                      <Plus className="w-4 h-4 mr-1" /> Save to shelf
                    </Button>
                  ) : (
                    <Link to={`/signin?redirect=${encodeURIComponent(`/book/${book.id}`)}`} className="inline-flex text-sm text-brand-primary mt-3">Sign in to save</Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>}
        {filteredTrendingBooks.length === 0 && (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="py-12 text-center space-y-2">
              <h3 className="text-lg font-semibold">No books match your filters</h3>
              <p className="text-sm text-muted-foreground">Try broadening your filters or searching with fewer keywords.</p>
            </CardContent>
          </Card>
        )}
      </section>

      <div className="text-center">
        <Button asChild variant="outline"><Link to="/library"><Search className="w-4 h-4 mr-2" />Browse the full library</Link></Button>
      </div>
    </div>
  );
};

export default Discovery;
