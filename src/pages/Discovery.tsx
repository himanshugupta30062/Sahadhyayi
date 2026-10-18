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
import { useAddToBookshelf } from '@/hooks/useUserBookshelf';
import { useAuth } from '@/contexts/authHelpers';
import { BookOpen, Plus, Search, Sparkles } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import libraryBg from '@/assets/library-hero-bg.jpg';

const Discovery = () => {
  const { user } = useAuth();
  const { data: books = [], isLoading, isError } = useAllLibraryBooks();
  const { data: recommendations = [] } = useBookRecommendations(user?.id);
  const addToShelf = useAddToBookshelf();
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'title_asc'>('relevance');

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

    if (languageFilter !== 'all') list = list.filter(book => book.language === languageFilter);
    if (genreFilter !== 'all') list = list.filter(book => book.genre === genreFilter);
    if (availabilityFilter === 'readable') list = list.filter(book => Boolean(book.pdf_url));

    if (sortBy === 'newest') list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sortBy === 'title_asc') list.sort((a, b) => a.title.localeCompare(b.title));

    return list.slice(0, 24);
  }, [availabilityFilter, books, genreFilter, languageFilter, searchQuery, sortBy]);

  const genres = useMemo(() => [...new Set(books.map((book) => book.genre).filter(Boolean))].sort(), [books]);
  const languages = useMemo(() => [...new Set(books.map((book) => book.language).filter(Boolean))].sort(), [books]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C201D] transition-colors duration-200 dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
      <SEO
        title="Book Discovery"
        description="Discover books from the Sahadhyayi library with personalized recommendations and reader-friendly filters."
        url="https://sahadhyayi.com/discovery"
      />
      <section className="relative isolate overflow-hidden border-b border-[#DCD5C9] bg-[#F4EFEA] dark:border-[#29332D] dark:bg-[#101711]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${libraryBg})`, backgroundPosition: 'center 47%' }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/95 via-[#FAF7F2]/83 to-[#FAF7F2]/48 dark:from-[#09120D]/95 dark:via-[#09120D]/83 dark:to-[#09120D]/42" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2]/70 via-transparent to-[#FAF7F2]/12 dark:from-[#09120D]/70 dark:via-transparent dark:to-[#09120D]/20" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(#1C442D_0.6px,transparent_0.6px)] [background-size:22px_22px] [mask-image:linear-gradient(to_right,black,transparent_85%)] dark:opacity-[0.08] dark:[background-image:radial-gradient(#D5B16D_0.6px,transparent_0.6px)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-22">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C8DBCB] bg-white/75 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.17em] text-[#1C442D] shadow-sm backdrop-blur-sm dark:border-[#D5B16D]/35 dark:bg-black/25 dark:text-[#E8CC91]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              A shelf full of possibilities
            </div>
            <h1 className="max-w-3xl font-serif text-4xl font-bold leading-[1.08] tracking-tight text-[#1C201D] dark:text-[#FBF7EF] sm:text-5xl md:text-6xl lg:text-7xl">
              A new world
              <span className="block text-[#8F681C] dark:text-[#E4C17B]">is one book away.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4F5D53] dark:text-white/80 sm:mt-6 sm:text-lg sm:leading-8">
              Explore stories, ideas, and perspectives across genres and languages. Find something worth carrying with you.
            </p>

            <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:mt-9 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69756D]" aria-hidden="true" />
                <Input
                  aria-label="Search books by title, author, or genre"
                  placeholder="Search by title, author, or genre…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    void trackUiEvent('discovery_filter_changed', { filter: 'search' });
                  }}
                  className="h-12 rounded-xl border border-[#DCD5C9] bg-white/95 pl-11 pr-4 text-[#1C201D] shadow-lg placeholder:text-[#798179] focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:border-white/20 dark:bg-white/95 dark:text-[#1C201D] sm:h-14"
                />
              </div>
              <Button asChild className="h-12 shrink-0 rounded-xl bg-[#1C442D] px-5 font-semibold text-white shadow-md transition hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#E4C17B] sm:h-14 sm:px-6">
                <Link to="/library">
                  <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                  Browse library
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Card className="mb-8 rounded-2xl border-[#E5DED2] bg-white shadow-[0_8px_30px_rgba(28,32,29,0.035)] dark:border-[#29332D] dark:bg-[#111614] dark:shadow-none">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1C201D] dark:text-[#F3F0E7]">Refine your discovery</h2>
                <p className="text-sm text-[#636B65] dark:text-[#A5ADA6]">Narrow the shelf by reading format, language, genre, or title.</p>
              </div>
              {searchQuery && <Badge variant="outline" className="mt-1 w-fit rounded-full border-[#C8DBCB] text-[#1C442D] dark:border-[#315C43] dark:text-[#D5B16D]">Search: {searchQuery}</Badge>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Select value={sortBy} onValueChange={(value: 'relevance' | 'newest' | 'title_asc') => {
                setSortBy(value);
                void trackUiEvent('discovery_filter_changed', { filter: 'sort', value });
              }}>
                <SelectTrigger aria-label="Sort books" className="h-11 rounded-xl border-[#E5DED2] bg-[#FAF7F2] dark:border-[#29332D] dark:bg-[#0B0D0C]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Sort: Relevance</SelectItem>
                  <SelectItem value="newest">Sort: Newest added</SelectItem>
                  <SelectItem value="title_asc">Sort: Title A–Z</SelectItem>
                </SelectContent>
              </Select>
              <Select value={availabilityFilter} onValueChange={(value) => {
                setAvailabilityFilter(value);
                void trackUiEvent('discovery_filter_changed', { filter: 'availability', value });
              }}>
                <SelectTrigger aria-label="Filter by availability" className="h-11 rounded-xl border-[#E5DED2] bg-[#FAF7F2] dark:border-[#29332D] dark:bg-[#0B0D0C]">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All availability</SelectItem>
                  <SelectItem value="readable">Readable online</SelectItem>
                </SelectContent>
              </Select>
              <Select value={languageFilter} onValueChange={(value) => {
                setLanguageFilter(value);
                void trackUiEvent('discovery_filter_changed', { filter: 'language', value });
              }}>
                <SelectTrigger aria-label="Filter by language" className="h-11 rounded-xl border-[#E5DED2] bg-[#FAF7F2] dark:border-[#29332D] dark:bg-[#0B0D0C]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  {languages.map((language) => <SelectItem key={language} value={language}>{language}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={genreFilter} onValueChange={(value) => {
                setGenreFilter(value);
                void trackUiEvent('discovery_filter_changed', { filter: 'genre', value });
              }}>
                <SelectTrigger aria-label="Filter by genre" className="h-11 rounded-xl border-[#E5DED2] bg-[#FAF7F2] dark:border-[#29332D] dark:bg-[#0B0D0C]">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All genres</SelectItem>
                  {genres.map((genre) => <SelectItem key={genre} value={genre}>{genre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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

      <div className="pb-10 text-center">
        <Button asChild variant="outline" className="rounded-xl border-[#D5CEC2] text-[#1C442D] dark:border-[#34443A] dark:text-[#D5B16D]"><Link to="/library"><Search className="mr-2 h-4 w-4" />Browse the full library</Link></Button>
      </div>
      </main>
    </div>
  );
};

export default Discovery;
