import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Compass,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FollowButton } from '@/components/authors/FollowButton';
import { VerificationBadge } from '@/components/authors/VerificationBadge';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import LibraryPagination from '@/components/library/LibraryPagination';
import { useAuthors, type Author } from '@/hooks/useAuthors';
import { useAllLibraryBooks, type Book } from '@/hooks/useLibraryBooks';
import { slugify } from '@/utils/slugify';
import BookFlipLoader from '@/components/ui/BookFlipLoader';

type SortMode = 'books' | 'name' | 'newest';

const normalizeKey = (value?: string | null) => (value || '').trim().toLocaleLowerCase();

const Authors = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const { data: authors = [], isLoading, error, refetch } = useAuthors();
  const { data: libraryBooks = [] } = useAllLibraryBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState<SortMode>('books');

  const booksByAuthor = useMemo(() => {
    const map: Record<string, Book[]> = {};
    libraryBooks.forEach((book) => {
      const key = normalizeKey(book.author);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(book);
    });
    return map;
  }, [libraryBooks]);

  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    authors.forEach((author) => (author.genres || []).forEach((genre) => {
      const value = genre.trim();
      if (value) genreSet.add(value);
    }));
    return Array.from(genreSet).sort((a, b) => a.localeCompare(b));
  }, [authors]);

  const filteredAuthors = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    const filtered = authors.filter((author) => {
      const matchesSearch = !query ||
        author.name.toLocaleLowerCase().includes(query) ||
        (author.bio || '').toLocaleLowerCase().includes(query) ||
        (author.genres || []).some((genre) => genre.toLocaleLowerCase().includes(query));
      const matchesGenre = selectedGenre === 'all' || (author.genres || []).includes(selectedGenre);
      return matchesSearch && matchesGenre;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'books') return (b.books_count || 0) - (a.books_count || 0) || a.name.localeCompare(b.name);
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.name.localeCompare(b.name);
    });
  }, [authors, searchTerm, selectedGenre, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAuthors.length / pageSize));
  const paginatedAuthors = filteredAuthors.slice((page - 1) * pageSize, page * pageSize);
  const hasActiveFilters = Boolean(searchTerm) || selectedGenre !== 'all' || sortBy !== 'books';

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedGenre, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGenre('all');
    setSortBy('books');
  };

  const breadcrumbItems = [{ name: 'Authors', path: '/authors', current: true }];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] dark:bg-[#0B0D0C]">
        <BookFlipLoader size="md" text="Finding authors..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#FAF7F2] px-4 dark:bg-[#0B0D0C]">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1C201D] dark:text-[#F3F0E7]">Authors are taking a quiet moment</h1>
          <p className="mt-2 text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">We couldn’t load the author directory just now. Please try again.</p>
          <Button onClick={() => refetch()} className="mt-5 gap-2 bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#E4C17B]">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Discover Authors & Writers | Sahadhyayi"
        description="Meet the writers behind the books. Explore author profiles, browse genres, discover their work, and follow the voices that inspire you."
        canonical="https://sahadhyayi.com/authors"
        url="https://sahadhyayi.com/authors"
      />

      <div className="min-h-screen bg-[#FAF7F2] text-[#1C201D] transition-colors duration-200 dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        {/* Photo-led hero: the page starts with a literary atmosphere, not a dashboard. */}
        <section className="relative isolate overflow-hidden border-b border-[#29332D] bg-[#101711] text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=2400&q=85')",
              backgroundPosition: 'center 42%',
            }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#09120D]/95 via-[#09120D]/79 to-[#09120D]/38" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#09120D]/70 via-transparent to-[#09120D]/25" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.6)_0.7px,transparent_0.7px)] [background-size:18px_18px] [mask-image:linear-gradient(to_right,black,transparent_80%)]" />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D5B16D]/35 bg-black/25 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E8CC91] backdrop-blur-sm sm:mb-6">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                The people behind the pages
              </div>
              <h1 className="max-w-3xl font-serif text-4xl font-bold leading-[1.08] tracking-tight text-[#FBF7EF] sm:text-5xl md:text-6xl lg:text-7xl">
                Meet the minds
                <span className="block text-[#E4C17B]">behind the books.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:mt-6 sm:text-lg sm:leading-8">
                Discover the writers, ideas, and worlds behind the books you love. Explore by name or genre, then follow the voices you want to hear from.
              </p>

              <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:mt-9 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69756D]" aria-hidden="true" />
                  <Input
                    placeholder="Search for an author by name…"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="h-12 rounded-xl border border-white/25 bg-white/95 pl-11 pr-11 text-[#1C201D] shadow-xl placeholder:text-[#798179] focus-visible:ring-2 focus-visible:ring-[#D5B16D] sm:h-14"
                    aria-label="Search authors by name, bio, or genre"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#69756D] transition hover:bg-black/5 hover:text-[#1C201D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D]"
                      aria-label="Clear author search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Link
                  to="/library"
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D] sm:h-14"
                >
                  Explore books <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/75">
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#E4C17B]" aria-hidden="true" /> <strong className="font-semibold text-white">{authors.length.toLocaleString()}</strong> authors</span>
                <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#E4C17B]" aria-hidden="true" /> <strong className="font-semibold text-white">{genres.length.toLocaleString()}</strong> genres represented</span>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div ref={scrollTargetRef} />
          <Breadcrumb items={breadcrumbItems} className="mb-6" />

          {/* A single, calm control row replaces the old dense panel and duplicate featured grid. */}
          <section aria-label="Filter authors" className="mb-8 rounded-2xl border border-[#E5DED2] bg-white p-4 shadow-[0_8px_30px_rgba(28,32,29,0.035)] dark:border-[#29332D] dark:bg-[#111614] dark:shadow-none sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
                <SlidersHorizontal className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D]" aria-hidden="true" />
                Find your kind of writer
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1.5 text-xs text-[#636B65] hover:text-[#1C442D] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D]">
                  <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(170px,0.42fr)]">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="h-11 rounded-xl border-[#E5DED2] bg-[#FAF7F2] dark:border-[#29332D] dark:bg-[#0B0D0C]">
                  <SelectValue placeholder="Filter by genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All genres</SelectItem>
                  {genres.map((genre) => <SelectItem key={genre} value={genre}>{genre}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: SortMode) => setSortBy(value)}>
                <SelectTrigger className="h-11 rounded-xl border-[#E5DED2] bg-[#FAF7F2] dark:border-[#29332D] dark:bg-[#0B0D0C]">
                  <SelectValue placeholder="Sort authors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="books">Most books in catalog</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                  <SelectItem value="newest">Recently added</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {genres.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedGenre('all')}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D] ${selectedGenre === 'all' ? 'border-[#1C442D] bg-[#1C442D] text-white dark:border-[#D5B16D] dark:bg-[#D5B16D] dark:text-[#0B0D0C]' : 'border-[#E5DED2] bg-transparent text-[#636B65] hover:border-[#1C442D]/40 hover:text-[#1C442D] dark:border-[#29332D] dark:text-[#A5ADA6] dark:hover:border-[#D5B16D]/40 dark:hover:text-[#D5B16D]'}`}
                >
                  All writers
                </button>
                {genres.slice(0, 8).map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(selectedGenre === genre ? 'all' : genre)}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D] ${selectedGenre === genre ? 'border-[#1C442D] bg-[#1C442D] text-white dark:border-[#D5B16D] dark:bg-[#D5B16D] dark:text-[#0B0D0C]' : 'border-[#E5DED2] bg-transparent text-[#636B65] hover:border-[#1C442D]/40 hover:text-[#1C442D] dark:border-[#29332D] dark:text-[#A5ADA6] dark:hover:border-[#D5B16D]/40 dark:hover:text-[#D5B16D]'}`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="authors-results-title">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">The author directory</p>
                <h2 id="authors-results-title" className="font-serif text-2xl font-bold tracking-tight text-[#1C201D] dark:text-[#F3F0E7] sm:text-3xl">
                  {searchTerm || selectedGenre !== 'all' ? 'Writers matching your interests' : 'Explore the writers'}
                </h2>
                <p className="mt-1 text-sm text-[#636B65] dark:text-[#A5ADA6]">
                  Showing {paginatedAuthors.length} of {filteredAuthors.length} author{filteredAuthors.length === 1 ? '' : 's'}
                  {selectedGenre !== 'all' ? ` · ${selectedGenre}` : ''}
                </p>
              </div>
              <div className="hidden items-center gap-2 text-xs text-[#737B75] dark:text-[#89938B] md:flex">
                <Compass className="h-4 w-4 text-[#B68A35] dark:text-[#D5B16D]" aria-hidden="true" />
                <span>Follow a voice that moves you.</span>
              </div>
            </div>

            {filteredAuthors.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#DCD5C9] bg-white/70 px-5 py-16 text-center dark:border-[#29332D] dark:bg-[#111614] sm:py-20">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C8DBCB] bg-[#EBF2EC] text-[#1C442D] dark:border-[#315C43] dark:bg-[#1C3024] dark:text-[#D5B16D]">
                  <Users className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                  {hasActiveFilters ? 'No writers found for this search' : 'The author shelves are quiet for now'}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">
                  {hasActiveFilters ? 'Try a broader name or genre, or clear your filters to see every author in the directory.' : 'Authors will appear here as their profiles and books become available.'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-5 rounded-xl border-[#D5CEC2] dark:border-[#34443A]">
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                  {paginatedAuthors.map((author) => (
                    <AuthorCard
                      key={author.id}
                      author={author}
                      books={booksByAuthor[normalizeKey(author.name)] ?? []}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8">
                    <LibraryPagination
                      totalCount={filteredAuthors.length}
                      currentPage={page}
                      pageSize={pageSize}
                      onPageChange={setPage}
                      onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                      scrollTargetRef={scrollTargetRef}
                      itemLabel="authors"
                    />
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </>
  );
};

const AuthorCard = ({ author, books }: { author: Author; books: Book[] }) => {
  const initials = author.name.trim().split(/\s+/).map((part) => part[0] || '').slice(0, 2).join('').toUpperCase() || 'A';
  const profilePath = `/authors/${slugify(author.name)}`;
  const topBooks = books.slice(0, 2);
  const bio = author.bio?.trim() && author.bio !== 'Bio will be updated by the author.' ? author.bio : null;

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5DED2] bg-white shadow-[0_6px_24px_rgba(28,32,29,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#B68A35]/50 hover:shadow-[0_18px_45px_rgba(28,32,29,0.09)] dark:border-[#29332D] dark:bg-[#111614] dark:shadow-none dark:hover:border-[#D5B16D]/40">
      <Link to={profilePath} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D]">
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#10251A] via-[#1C442D] to-[#6C5833] sm:h-32">
          <div aria-hidden="true" className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.7)_0.7px,transparent_0.7px)] [background-size:14px_14px]" />
          <div aria-hidden="true" className="absolute -right-8 -top-12 h-40 w-40 rounded-full border border-white/15" />
          <div aria-hidden="true" className="absolute -right-2 -top-6 h-28 w-28 rounded-full border border-white/15" />
          {author.verified && (
            <div className="absolute right-3 top-3">
              <VerificationBadge verified={true} verificationType={author.verification_type} />
            </div>
          )}
          <div className="absolute bottom-0 left-5 translate-y-1/2">
            <Avatar className="h-16 w-16 border-4 border-white shadow-md dark:border-[#111614] sm:h-[4.5rem] sm:w-[4.5rem]">
              <AvatarImage src={author.profile_image_url || ''} alt={author.name} />
              <AvatarFallback className="bg-[#D5B16D] text-base font-bold text-[#14251B]">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="px-5 pb-0 pt-11 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-serif text-xl font-bold tracking-tight text-[#1C201D] transition-colors group-hover:text-[#1C442D] dark:text-[#F3F0E7] dark:group-hover:text-[#D5B16D]">
                {author.name}
              </h3>
              {author.location && author.location !== 'Unknown' && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#737B75] dark:text-[#89938B]">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{author.location}</span>
                </p>
              )}
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#9A9F98] transition-transform group-hover:translate-x-1 group-hover:text-[#B68A35] dark:group-hover:text-[#D5B16D]" aria-hidden="true" />
          </div>

          {bio && (
            <p className="mt-3 line-clamp-3 min-h-[4.25rem] text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">
              {bio}
            </p>
          )}

          {author.genres?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {author.genres.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="outline" className="rounded-full border-[#DCD5C9] bg-[#FAF7F2] px-2.5 py-1 text-[10px] font-medium text-[#4F5D53] dark:border-[#34443A] dark:bg-[#172019] dark:text-[#B9C9BC]">
                  {genre}
                </Badge>
              ))}
              {author.genres.length > 3 && <span className="self-center text-[10px] text-[#737B75] dark:text-[#89938B]">+{author.genres.length - 3}</span>}
            </div>
          )}

        </div>
      </Link>

      <div className="border-t border-[#EDE7DE] px-5 py-4 dark:border-[#26302A] sm:px-6">
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737B75] dark:text-[#89938B]">Books by this author</span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[#737B75] dark:text-[#89938B]">{author.books_count} in catalog</span>
            <Link to={`/library?author=${encodeURIComponent(author.name)}`} className="shrink-0 font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">All books →</Link>
          </div>
        </div>
        {topBooks.length > 0 ? (
          <div className="space-y-2">
            {topBooks.map((book) => (
              <Link key={book.id} to={`/book/${book.id}`} className="flex min-w-0 items-center gap-2 text-sm text-[#4F5D53] hover:text-[#1C442D] hover:underline dark:text-[#B9C9BC] dark:hover:text-[#D5B16D]">
                {book.cover_image_url && (
                  <img src={book.cover_image_url} alt={book.title} width="28" height="40" loading="lazy" className="h-10 w-7 shrink-0 rounded-sm object-cover" />
                )}
                <span className="truncate">{book.title}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#737B75] dark:text-[#89938B]">{author.books_count} books in catalogue</p>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <FollowButton authorId={author.id} size="sm" showText={true} />
        <Button asChild size="sm" variant="outline" className="h-9 flex-1 rounded-lg border-[#D5CEC2] text-xs font-semibold text-[#1C442D] transition hover:border-[#1C442D]/40 hover:bg-[#EBF2EC] dark:border-[#34443A] dark:text-[#D5B16D] dark:hover:border-[#D5B16D]/40 dark:hover:bg-[#1C3024]">
          <Link to={profilePath}>View profile <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" /></Link>
        </Button>
      </div>
    </Card>
  );
};

export default Authors;
