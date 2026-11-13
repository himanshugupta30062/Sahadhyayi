import { useEffect, useMemo, useState } from 'react';
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
import { useAddToBookshelf } from '@/hooks/useUserBookshelf';
import { useAuth } from '@/contexts/authHelpers';
import { BookOpen, Plus, Search, Sparkles, RotateCcw } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import SemanticBookDiscovery from '@/components/discovery/SemanticBookDiscovery';

const Discovery = () => {
  const { user } = useAuth();
  const { data: books = [], isLoading, isError } = useAllLibraryBooks();
  const { data: recommendations = [] } = useBookRecommendations(user?.id);
  const addToShelf = useAddToBookshelf();
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [publicationPeriodFilter, setPublicationPeriodFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'title_asc' | 'quality' | 'rating' | 'author_asc'>('relevance');
  const [visibleCount, setVisibleCount] = useState(24);

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
    if (selectedGenres.length > 0) list = list.filter((book) => selectedGenres.includes(book.genre ?? ''));
    if (availabilityFilter === 'readable') list = list.filter((book) => Boolean(book.pdf_url));
    if (publicationPeriodFilter !== 'all') {
      list = list.filter((book) => {
        const year = Number(book.publication_year);
        if (!Number.isFinite(year) || year <= 0) return publicationPeriodFilter === 'unknown';
        if (publicationPeriodFilter === 'before_2000') return year < 2000;
        if (publicationPeriodFilter === '2000s') return year >= 2000 && year < 2010;
        if (publicationPeriodFilter === '2010s') return year >= 2010 && year < 2020;
        if (publicationPeriodFilter === '2020s') return year >= 2020 && year < 2030;
        return false;
      });
    }

    if (sortBy === 'newest') list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sortBy === 'title_asc') list.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'author_asc') list.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
    if (sortBy === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sortBy === 'quality' || sortBy === 'relevance') list.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0) || (b.rating ?? 0) - (a.rating ?? 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return list;
  }, [availabilityFilter, books, selectedGenres, languageFilter, publicationPeriodFilter, searchQuery, sortBy]);

  useEffect(() => { setVisibleCount(24); }, [searchQuery, languageFilter, selectedGenres, availabilityFilter, publicationPeriodFilter, sortBy]);
  const visibleBooks = filteredTrendingBooks.slice(0, visibleCount);

  const genres = useMemo(
    () => [...new Set(books.map((book) => book.genre).filter(Boolean))].sort((a, b) => (a ?? '').localeCompare(b ?? '')),
    [books],
  );
  const hasActiveFilters = Boolean(searchQuery.trim()) || languageFilter !== 'all' || selectedGenres.length > 0 || availabilityFilter !== 'all' || publicationPeriodFilter !== 'all' || sortBy !== 'relevance';
  const clearFilters = () => {
    setSearchQuery('');
    setLanguageFilter('all');
    setSelectedGenres([]);
    setAvailabilityFilter('all');
    setPublicationPeriodFilter('all');
    setSortBy('relevance');
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
            <Select value={sortBy} onValueChange={(value: 'relevance' | 'newest' | 'title_asc' | 'quality' | 'rating' | 'author_asc') => {
              setSortBy(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'sort', value });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Sort: Recommended</SelectItem>
                <SelectItem value="quality">Sort: Catalog quality</SelectItem>
                <SelectItem value="rating">Sort: Rating</SelectItem>
                <SelectItem value="author_asc">Sort: Author A-Z</SelectItem>
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
            <div className="md:col-span-3 space-y-2">
              <p className="text-sm font-medium">Genres <span className="text-muted-foreground font-normal">(select multiple)</span></p>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => {
                  const active = selectedGenres.includes(genre ?? '');
                  return <Button key={genre} type="button" size="sm" variant={active ? 'default' : 'outline'} aria-pressed={active}
                    onClick={() => {
                      const value = genre ?? '';
                      setSelectedGenres((current) => active ? current.filter((item) => item !== value) : [...current, value]);
                      void trackUiEvent('discovery_filter_changed', { filter: 'genre', value, action: active ? 'remove' : 'add' });
                    }}>{genre}</Button>;
                })}
                {selectedGenres.length > 0 && <Button type="button" size="sm" variant="ghost" onClick={() => setSelectedGenres([])}>Clear genres</Button>}
              </div>
            </div>
            <Select value={publicationPeriodFilter} onValueChange={(value) => {
              setPublicationPeriodFilter(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'publication_period', value });
            }}>
              <SelectTrigger><SelectValue placeholder="Publication period" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any publication year</SelectItem>
                <SelectItem value="before_2000">Before 2000</SelectItem>
                <SelectItem value="2000s">2000–2009</SelectItem>
                <SelectItem value="2010s">2010–2019</SelectItem>
                <SelectItem value="2020s">2020–2029</SelectItem>
                <SelectItem value="unknown">Year not listed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && <div className="flex justify-end"><Button type="button" variant="ghost" size="sm" onClick={clearFilters}><RotateCcw className="w-4 h-4 mr-2" />Clear filters</Button></div>}
        </CardContent>
      </Card>

      {user && recommendations.length > 0 && (
        <section className="mb-10" aria-labelledby="recommended-heading">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <h2 id="recommended-heading" className="text-2xl font-semibold">Recommended for you</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.slice(0, 4).map((book) => (
              <Link key={book.id} to={`/book/${book.id}`} className="block">
                <Card className="h-full border-border hover:border-brand-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <p className="text-xs text-brand-primary font-medium mb-2">Based on your bookshelf</p>
                    <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{book.author || 'Unknown author'}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Explore the library</h2>
        {isLoading && <div className="flex justify-center py-16"><LoadingSpinner /></div>}
        {isError && <p className="text-center text-destructive py-12">Books could not be loaded. Please try again.</p>}
        {!isLoading && !isError && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleBooks.map((book) => (
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
        {filteredTrendingBooks.length > visibleBooks.length && <div className="mt-6 text-center"><p className="mb-3 text-sm text-muted-foreground">Showing {visibleBooks.length} of {filteredTrendingBooks.length} books</p><Button variant="outline" onClick={() => setVisibleCount((count) => count + 24)}>Load 24 more books</Button></div>}
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
