import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertCircle, RefreshCw, Star, Users, BookOpen, Sparkles, ArrowRight, TrendingUp, Library } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FollowButton } from '@/components/authors/FollowButton';
import { VerificationBadge } from '@/components/authors/VerificationBadge';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import LibraryPagination from '@/components/library/LibraryPagination';
import { useAuthors, type Author } from '@/hooks/useAuthors';
import { useAllLibraryBooks, type Book } from '@/hooks/useLibraryBooks';
import { slugify } from '@/utils/slugify';
import BookFlipLoader from '@/components/ui/BookFlipLoader';
import { motion } from 'framer-motion';

const Authors = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const { data: authors = [], isLoading, error, refetch } = useAuthors();
  const { data: libraryBooks = [] } = useAllLibraryBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const booksByAuthor = useMemo(() => {
    const map: Record<string, Book[]> = {};
    libraryBooks.forEach(book => {
      const key = book.author?.toLowerCase().trim();
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(book);
    });
    return map;
  }, [libraryBooks]);

  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    authors.forEach(author => author.genres.forEach(g => genreSet.add(g)));
    return Array.from(genreSet).sort();
  }, [authors]);

  const filteredAuthors = useMemo(() => {
    let result = authors.filter(author => {
      const matchesSearch = !searchTerm ||
        author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.genres.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesGenre = selectedGenre === 'all' || author.genres.includes(selectedGenre);
      return matchesSearch && matchesGenre;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'popular': return (b.followers_count * b.rating) - (a.followers_count * a.rating);
        case 'books': return b.books_count - a.books_count;
        case 'rating': return b.rating - a.rating;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    return result;
  }, [authors, searchTerm, selectedGenre, sortBy]);

  const totalPages = Math.ceil(filteredAuthors.length / pageSize) || 1;
  const paginatedAuthors = filteredAuthors.slice((page - 1) * pageSize, page * pageSize);

  const featuredAuthors = useMemo(() => {
    return [...authors]
      .filter(a => a.books_count > 0)
      .sort((a, b) => (b.books_count * b.rating * (b.followers_count + 1)) - (a.books_count * a.rating * (a.followers_count + 1)))
      .slice(0, 4);
  }, [authors]);

  useEffect(() => { setPage(1); }, [searchTerm, selectedGenre, sortBy]);

  const breadcrumbItems = [{ name: 'Authors', path: '/authors', current: true }];

  const totalBooks = authors.reduce((sum, a) => sum + a.books_count, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <BookFlipLoader size="md" text="Loading authors..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Unable to Load Authors</h1>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message || 'Error loading authors.'}</AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="bg-gradient-button text-white">
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Authors Directory - Discover Writers | Sahadhyayi"
        description="Explore talented authors, discover their works, and connect with writers who inspire you on Sahadhyayi."
        canonical="https://sahadhyayi.com/authors"
        url="https://sahadhyayi.com/authors"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-[0.04]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--brand-primary)/0.1),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--brand-secondary)/0.08),transparent_60%)]" />
          
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 sm:pb-12 relative">
            <Breadcrumb items={breadcrumbItems} className="mb-4 sm:mb-6" />
            <div ref={scrollTargetRef} />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="text-center mb-6 sm:mb-10"
            >
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-[hsl(var(--brand-primary)/0.1)] text-[hsl(var(--brand-primary))] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-5">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Literary Community
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-2 sm:mb-4 tracking-tight leading-tight">
                Discover <span className="bg-clip-text text-transparent bg-gradient-button">Authors</span>
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
                Explore profiles, follow your favorites, and browse books from our community of writers.
              </p>

              {/* Stats row */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-10 mt-5 sm:mt-8">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{authors.length}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5">Authors</div>
                </div>
                <div className="w-px h-8 sm:h-10 bg-border" />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{totalBooks}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5">Books</div>
                </div>
                <div className="w-px h-8 sm:h-10 bg-border" />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{genres.length}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5">Genres</div>
                </div>
              </div>
            </motion.div>

            {/* Search & Filters */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.15 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-card/80 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-[var(--shadow-card)] border border-border/60 p-3 sm:p-4 md:p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  <div className="col-span-2 relative">
                    <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by name, bio, or genre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 sm:pl-10 h-10 sm:h-11 bg-muted/40 border-border/60 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-[hsl(var(--brand-primary)/0.2)] transition-all"
                    />
                  </div>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="h-10 sm:h-11 bg-muted/40 border-border/60 rounded-lg sm:rounded-xl text-xs sm:text-sm">
                      <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-10 sm:h-11 bg-muted/40 border-border/60 rounded-lg sm:rounded-xl text-xs sm:text-sm">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="books">Most Books</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="name">A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Featured Authors */}
          {featuredAuthors.length > 0 && !searchTerm && selectedGenre === 'all' && (
            <motion.section 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.4, delay: 0.25 }}
              className="mb-8 sm:mb-14"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 mb-4 sm:mb-7">
                <div className="p-1.5 sm:p-2 rounded-lg bg-[hsl(var(--brand-primary)/0.1)]">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--brand-primary))]" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-foreground">Featured Authors</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Top writers in our community</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
                {featuredAuthors.map((author, i) => (
                  <motion.div
                    key={author.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * i }}
                  >
                    <FeaturedAuthorCard author={author} books={booksByAuthor[author.name.toLowerCase().trim()] ?? []} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* All Authors */}
          <section>
            <div className="flex items-center justify-between mb-4 sm:mb-7">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-lg bg-muted">
                  <Library className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-foreground">
                    {searchTerm || selectedGenre !== 'all' ? 'Search Results' : 'All Authors'}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {filteredAuthors.length} author{filteredAuthors.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>

            {filteredAuthors.length === 0 ? (
              <div className="text-center py-12 sm:py-20 bg-muted/30 rounded-2xl border border-border/40">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/20 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No authors found</h3>
                <p className="text-sm text-muted-foreground mb-4 sm:mb-6">Try adjusting your search or filters</p>
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchTerm(''); setSelectedGenre('all'); }}
                  className="border-border"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5 mb-6 sm:mb-10">
                  {paginatedAuthors.map((author, i) => (
                    <motion.div
                      key={author.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                    >
                      <AuthorCard author={author} books={booksByAuthor[author.name.toLowerCase().trim()] ?? []} />
                    </motion.div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <LibraryPagination
                    totalCount={filteredAuthors.length}
                    currentPage={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                    scrollTargetRef={scrollTargetRef}
                    itemLabel="authors"
                  />
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

/* ─── Featured Author Card ─── */
const FeaturedAuthorCard = ({ author, books }: { author: Author; books: Book[] }) => {
  const initials = author.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const topBooks = books.slice(0, 3);

  return (
    <Link to={`/authors/${slugify(author.name)}`} className="block group">
      <Card className="overflow-hidden border-border/60 hover:shadow-[var(--shadow-elevated)] transition-all duration-300 hover:-translate-y-1.5 h-full bg-card">
        {/* Book covers strip */}
        <div className="h-24 sm:h-32 bg-gradient-to-br from-[hsl(var(--brand-primary)/0.08)] to-[hsl(var(--brand-secondary)/0.12)] relative overflow-hidden flex items-end justify-center gap-1.5 sm:gap-2.5 px-2 sm:px-4 pt-2 sm:pt-3 pb-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--brand-primary)/0.06),transparent_70%)]" />
          {topBooks.length > 0 ? topBooks.map((book, i) => (
            <div
              key={book.id}
              className="w-12 h-16 sm:w-[68px] sm:h-[92px] rounded-t-md overflow-hidden shadow-lg border border-border/30 flex-shrink-0 bg-card relative z-10 transition-transform duration-300 group-hover:scale-[1.03]"
              style={{ transform: `translateY(${i === 1 ? -4 : 0}px)` }}
            >
              {book.cover_image_url ? (
                <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/40" />
                </div>
              )}
            </div>
          )) : (
            <div className="flex items-center justify-center h-full w-full">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[hsl(var(--brand-primary)/0.2)]" />
            </div>
          )}
        </div>

        <CardContent className="p-3 sm:p-5 pt-3 sm:pt-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <Avatar className="w-9 h-9 sm:w-12 sm:h-12 ring-2 ring-border group-hover:ring-[hsl(var(--brand-primary)/0.4)] transition-all flex-shrink-0 shadow-sm">
              <AvatarImage src={author.profile_image_url || ''} alt={author.name} />
              <AvatarFallback className="text-[10px] sm:text-sm font-bold bg-gradient-button text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="text-xs sm:text-base font-semibold text-foreground truncate">{author.name}</h3>
                <VerificationBadge verified={author.verified || false} verificationType={author.verification_type} className="scale-75 sm:scale-90" />
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-0.5 sm:gap-1"><BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {author.books_count}</span>
                <span className="flex items-center gap-0.5 sm:gap-1"><Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" /> {author.rating}</span>
              </div>
            </div>
          </div>

          {author.bio && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mb-2 sm:mb-3 leading-relaxed hidden sm:block">{author.bio}</p>
          )}

          {author.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-4">
              {author.genres.slice(0, 2).map(g => (
                <Badge key={g} variant="secondary" className="text-[9px] sm:text-[10px] bg-[hsl(var(--brand-primary)/0.08)] text-[hsl(var(--brand-primary))] border-0 px-1.5 sm:px-2 py-0 sm:py-0.5 font-medium">{g}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2" onClick={(e) => e.preventDefault()}>
            <div onClick={(e) => e.stopPropagation()} className="hidden sm:block">
              <FollowButton authorId={author.id} size="sm" showText={false} />
            </div>
            <Button variant="outline" size="sm" className="flex-1 text-[10px] sm:text-xs h-7 sm:h-8 border-border/60 group-hover:border-[hsl(var(--brand-primary)/0.4)] group-hover:text-[hsl(var(--brand-primary))] transition-colors">
              View <span className="hidden sm:inline ml-1">Profile</span> <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

/* ─── Standard Author Card ─── */
const AuthorCard = ({ author, books }: { author: Author; books: Book[] }) => {
  const initials = author.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const topBooks = books.slice(0, 4);

  return (
    <Link to={`/authors/${slugify(author.name)}`} className="block group">
      <Card className="h-full border-border/50 hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 bg-card overflow-hidden">
        <CardContent className="p-0">
          {/* Author header */}
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 pb-2 sm:pb-3">
            <Avatar className="w-9 h-9 sm:w-11 sm:h-11 ring-2 ring-border/60 group-hover:ring-[hsl(var(--brand-primary)/0.35)] transition-all flex-shrink-0 shadow-sm">
              <AvatarImage src={author.profile_image_url || ''} alt={author.name} />
              <AvatarFallback className="text-[10px] sm:text-sm font-bold bg-gradient-button text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{author.name}</h3>
                {author.verified && (
                  <VerificationBadge verified={true} verificationType={author.verification_type} className="scale-[0.7] sm:scale-[0.8]" />
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" /> {author.rating}</span>
                <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {author.followers_count.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Bio - hidden on small screens */}
          {author.bio && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 px-3 sm:px-4 mb-2 sm:mb-3 leading-relaxed hidden sm:block">{author.bio}</p>
          )}

          {/* Genre tags */}
          {author.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 px-3 sm:px-4 mb-2 sm:mb-3">
              {author.genres.slice(0, 2).map(g => (
                <Badge key={g} variant="outline" className="text-[9px] sm:text-[10px] border-border/60 text-muted-foreground px-1.5 sm:px-2 py-0 font-normal">{g}</Badge>
              ))}
              {author.genres.length > 2 && (
                <Badge variant="outline" className="text-[9px] sm:text-[10px] border-border/60 text-muted-foreground px-1.5 sm:px-2 py-0 font-normal">+{author.genres.length - 2}</Badge>
              )}
            </div>
          )}

          {/* Book covers row */}
          <div className="px-3 sm:px-4 mb-2 sm:mb-3">
            <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 sm:mb-2">
              {author.books_count} {author.books_count === 1 ? 'Book' : 'Books'}
            </p>
            {topBooks.length > 0 ? (
              <div className="flex gap-1.5 sm:gap-2">
                {topBooks.slice(0, 3).map(book => (
                  <div key={book.id} className="w-9 h-12 sm:w-12 sm:h-[62px] rounded overflow-hidden border border-border/40 bg-muted flex-shrink-0 shadow-sm transition-transform group-hover:scale-[1.02]">
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                ))}
                {author.books_count > 3 && (
                  <div className="w-9 h-12 sm:w-12 sm:h-[62px] rounded border border-dashed border-border/60 flex items-center justify-center text-[9px] sm:text-[10px] text-muted-foreground font-medium bg-muted/30">
                    +{author.books_count - 3}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-12 sm:h-[62px] flex items-center">
                <span className="text-[10px] sm:text-xs text-muted-foreground/50 italic">Books on profile</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 sm:gap-2 p-3 sm:p-4 pt-2 border-t border-border/30" onClick={(e) => e.preventDefault()}>
            <div onClick={(e) => e.stopPropagation()} className="hidden sm:block">
              <FollowButton authorId={author.id} size="sm" showText={false} />
            </div>
            <Button variant="outline" size="sm" className="flex-1 text-[10px] sm:text-xs h-7 sm:h-8 border-border/60 group-hover:border-[hsl(var(--brand-primary)/0.3)] group-hover:text-[hsl(var(--brand-primary))] transition-colors">
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default Authors;
