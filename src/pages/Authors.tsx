import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, AlertCircle, RefreshCw, Star, Users, BookOpen, Sparkles } from 'lucide-react';
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
        author.bio?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || author.genres.includes(selectedGenre);
      return matchesSearch && matchesGenre;
    });

    // Sort
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
      .sort((a, b) => (b.books_count * b.rating * b.followers_count) - (a.books_count * a.rating * a.followers_count))
      .slice(0, 3);
  }, [authors]);

  useEffect(() => { setPage(1); }, [searchTerm, selectedGenre, sortBy]);

  const breadcrumbItems = [{ name: 'Authors', path: '/authors', current: true }];

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
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary/5 via-background to-brand-secondary/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--brand-primary)/0.08),transparent_60%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 relative">
            <Breadcrumb items={breadcrumbItems} className="mb-6" />
            <div ref={scrollTargetRef} />
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
                Discover Authors
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore profiles, follow your favorites, and connect with {authors.length}+ writers in our community.
              </p>
            </div>

            {/* Search & Filters */}
            <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-[var(--shadow-card)] border border-border p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name or bio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-muted/50 border-border rounded-xl"
                  />
                </div>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="h-11 bg-muted/50 border-border rounded-xl">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11 bg-muted/50 border-border rounded-xl">
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
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Featured Authors */}
          {featuredAuthors.length > 0 && !searchTerm && selectedGenre === 'all' && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-brand-primary" />
                <h2 className="text-2xl font-bold text-foreground">Featured Authors</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredAuthors.map(author => (
                  <FeaturedAuthorCard key={author.id} author={author} books={booksByAuthor[author.name.toLowerCase().trim()] ?? []} />
                ))}
              </div>
            </section>
          )}

          {/* All Authors */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                All Authors
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredAuthors.length})
                </span>
              </h2>
            </div>

            {filteredAuthors.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">No authors found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
                  {paginatedAuthors.map(author => (
                    <AuthorCard key={author.id} author={author} books={booksByAuthor[author.name.toLowerCase().trim()] ?? []} />
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

// Featured Author Card — larger, more prominent
const FeaturedAuthorCard = ({ author, books }: { author: Author; books: Book[] }) => (
  <Link to={`/authors/${slugify(author.name)}`} className="block group">
    <Card className="overflow-hidden border-border hover:shadow-[var(--shadow-elevated)] transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-muted/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-16 h-16 ring-2 ring-brand-primary/20 group-hover:ring-brand-primary/50 transition-all">
            <AvatarImage src={author.profile_image_url || ''} alt={author.name} />
            <AvatarFallback className="text-lg font-bold bg-gradient-button text-white">
              {author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-foreground truncate">{author.name}</h3>
              <VerificationBadge verified={author.verified || false} verificationType={author.verification_type} />
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{author.location}</span>
            </div>
          </div>
        </div>

        {author.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{author.bio}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {author.books_count} books</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {author.followers_count.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" /> {author.rating}</span>
        </div>

        {author.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {author.genres.slice(0, 3).map(g => (
              <Badge key={g} variant="secondary" className="text-xs bg-brand-primary/10 text-brand-primary border-0">{g}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
          <FollowButton authorId={author.id} size="sm" variant="default" />
          <Button variant="outline" size="sm" className="flex-1 border-border text-foreground hover:bg-accent">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  </Link>
);

// Standard Author Card
const AuthorCard = ({ author, books }: { author: Author; books: Book[] }) => (
  <Link to={`/authors/${slugify(author.name)}`} className="block group">
    <Card className="h-full border-border hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 bg-card">
      <CardContent className="p-5">
        <div className="text-center mb-3">
          <Avatar className="w-14 h-14 mx-auto mb-3 ring-2 ring-border group-hover:ring-brand-primary/40 transition-all">
            <AvatarImage src={author.profile_image_url || ''} alt={author.name} />
            <AvatarFallback className="font-bold bg-gradient-button text-white">
              {author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h3 className="text-base font-semibold text-foreground truncate">{author.name}</h3>
            {author.verified && (
              <VerificationBadge verified={true} verificationType={author.verification_type} className="scale-90" />
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" /> {author.location}
          </p>
        </div>

        {author.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 text-center">{author.bio}</p>
        )}

        <div className="grid grid-cols-3 gap-1 text-center text-xs mb-3">
          <div>
            <span className="font-semibold text-foreground block">{author.books_count}</span>
            <span className="text-muted-foreground">Books</span>
          </div>
          <div>
            <span className="font-semibold text-foreground block">{author.followers_count.toLocaleString()}</span>
            <span className="text-muted-foreground">Followers</span>
          </div>
          <div>
            <span className="font-semibold text-foreground block flex items-center justify-center gap-0.5">
              <Star className="w-3 h-3 text-amber-500" /> {author.rating}
            </span>
            <span className="text-muted-foreground">Rating</span>
          </div>
        </div>

        {author.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mb-3">
            {author.genres.slice(0, 2).map(g => (
              <Badge key={g} variant="outline" className="text-[10px] border-border text-muted-foreground">{g}</Badge>
            ))}
            {author.genres.length > 2 && (
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">+{author.genres.length - 2}</Badge>
            )}
          </div>
        )}

        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
          <FollowButton authorId={author.id} size="sm" showText={false} />
          <Button variant="outline" size="sm" className="flex-1 text-xs border-border">
            Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default Authors;
