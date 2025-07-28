
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, MapPin, Calendar, MessageSquare, Clock, AlertCircle, RefreshCw, Star, Users, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatWindow } from "@/components/social/ChatWindow";
import { ScheduleSessionDialog } from "@/components/authors/ScheduleSessionDialog";
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/ui/breadcrumb';
import { useAuthors, type Author } from '@/hooks/useAuthors';
import { useAllLibraryBooks, type Book } from '@/hooks/useLibraryBooks';
import { toast } from '@/hooks/use-toast';
import { generateWebsiteSchema, generateBreadcrumbSchema } from '@/utils/schema';

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const Authors = () => {
  console.log('Authors component rendering');
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: authors = [], isLoading, error, refetch } = useAuthors();
  const totalAuthors = authors.length;

  const { data: libraryBooks = [] } = useAllLibraryBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [bookCountFilter, setBookCountFilter] = useState('all');
  const [chatAuthor, setChatAuthor] = useState<string | null>(null);

  console.log('Authors page state:', {
    authorsCount: totalAuthors,
    isLoading,
    error: error?.message
  });

  // Map books by author name for quick lookup  
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

  // Show error toast if there's an error
  React.useEffect(() => {
    if (error) {
      console.error('Authors page error:', error);
      toast({
        variant: "destructive",
        title: "Error loading authors",
        description: "Unable to load author data. Please try refreshing the page."
      });
    }
  }, [error]);

  // Get unique genres from authors
  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    authors.forEach(author => {
      author.genres.forEach(genre => genreSet.add(genre));
    });
    return Array.from(genreSet).sort();
  }, [authors]);

  // Filter authors based on search, genre, and book count
  const filteredAuthors = useMemo(() => {
    return authors.filter(author => {
      const matchesSearch = !searchTerm || 
        author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.bio?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGenre = selectedGenre === 'all' || 
        author.genres.includes(selectedGenre);
      
      const matchesBookCount = bookCountFilter === 'all' || 
        (bookCountFilter === '1-3' && author.books_count >= 1 && author.books_count <= 3) ||
        (bookCountFilter === '4-10' && author.books_count >= 4 && author.books_count <= 10) ||
        (bookCountFilter === '10+' && author.books_count > 10);
      
    return matchesSearch && matchesGenre && matchesBookCount;
  });
  }, [authors, searchTerm, selectedGenre, bookCountFilter]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAuthors.length / pageSize) || 1;
  }, [filteredAuthors, pageSize]);

  const paginatedAuthors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAuthors.slice(start, start + pageSize);
  }, [filteredAuthors, page, pageSize]);

  // Featured authors prioritize those with books in the library
  const featuredAuthors = useMemo(() => {
    return [...authors]
      .sort((a, b) => {
        if (b.books_count !== a.books_count) {
          return b.books_count - a.books_count;
        }
        return (b.rating * b.followers_count) - (a.rating * a.followers_count);
      })
      .slice(0, 6);
  }, [authors]);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedGenre, bookCountFilter]);

  const handleRetry = () => {
    console.log('Retrying to fetch authors...');
    refetch();
  };

  // Breadcrumb data
  const breadcrumbItems = [
    { name: 'Authors', url: '/authors', current: true }
  ];

  // SEO Schema
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Authors Directory - Sahadhyayi",
    "description": "Discover talented authors on Sahadhyayi. Browse profiles, read biographies, and connect with writers from around the world.",
    "url": "https://sahadhyayi.com/authors",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Featured Authors",
      "numberOfItems": totalAuthors,
      "itemListElement": authors.slice(0, 10).map((author, index) => ({
        "@type": "Person",
        "position": index + 1,
        "name": author.name,
        "description": author.bio,
        "image": author.profile_image_url,
        "url": `https://sahadhyayi.com/author/${author.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
        "jobTitle": "Author",
        "knowsAbout": author.genres,
        "address": {
          "@type": "Place",
          "name": author.location
        }
      }))
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://sahadhyayi.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Authors",
          "item": "https://sahadhyayi.com/authors"
        }
      ]
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authors...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Authors</h1>
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message || 'There was an error loading the authors data. Please try again.'}
              </AlertDescription>
            </Alert>
            <div className="space-y-4">
              <Button onClick={handleRetry} className="bg-orange-600 hover:bg-orange-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <p className="text-sm text-gray-500">
                If the problem persists, please refresh the page or contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Authors Directory - Meet Talented Writers & Connect"
        description="Discover talented authors on Sahadhyayi reading community. Browse author profiles, read biographies, explore their works, and connect with writers from around the world. Find your next favorite author today."
        canonical="https://sahadhyayi.com/authors"
        url="https://sahadhyayi.com/authors"
        keywords={[
          'authors directory', 'writers community', 'book authors', 'literary writers',
          'author profiles', 'connect with authors', 'famous authors', 'new authors',
          'international authors', 'author biographies', 'reading community authors',
          'sahadhyayi authors', 'discover authors', 'author interviews'
        ]}
        schema={pageSchema}
        breadcrumbs={breadcrumbItems}
        type="website"
      />

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb items={breadcrumbItems} className="mb-6" />

          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Authors Directory
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
              Discover talented authors, explore their works, and connect with writers who inspire you.
            </p>
            <div className="text-sm text-gray-500">
              {totalAuthors > 0 ? (
                `Found ${totalAuthors} author${totalAuthors !== 1 ? 's' : ''} in our community`
              ) : (
                'Building our authors directory...'
              )}
            </div>
          </header>

          {/* Search and Filters */}
          <section aria-label="Author search and filters" className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Bar */}
              <div className="lg:col-span-2">
                <label htmlFor="author-search" className="sr-only">Search authors</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="author-search"
                    type="text"
                    placeholder="Search authors by name or bio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-gray-50 border-2 border-gray-200 focus:border-orange-400 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    aria-label="Search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Genre Filter */}
              <div>
                <label htmlFor="genre-filter" className="sr-only">Filter by genre</label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger id="genre-filter" className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-orange-400 rounded-xl">
                    <SelectValue placeholder="Filter by Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Book Count Filter */}
              <div>
                <label htmlFor="book-count-filter" className="sr-only">Filter by books published</label>
                <Select value={bookCountFilter} onValueChange={setBookCountFilter}>
                  <SelectTrigger id="book-count-filter" className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-orange-400 rounded-xl">
                    <SelectValue placeholder="Books Published" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Amount</SelectItem>
                    <SelectItem value="1-3">1-3 Books</SelectItem>
                    <SelectItem value="4-10">4-10 Books</SelectItem>
                    <SelectItem value="10+">10+ Books</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Show message if no authors found */}
          {filteredAuthors.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-500 mb-2">No Authors Found</h2>
              <p className="text-gray-400 mb-6">
                We're building our authors directory. Check back soon for more authors!
              </p>
              <Link to="/library">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Explore Library
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Featured Authors */}
              {featuredAuthors.length > 0 && (
                <section aria-labelledby="featured-authors" className="mb-12">
                  <h2 id="featured-authors" className="text-2xl font-bold text-gray-900 mb-6">Featured Authors</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredAuthors.map(author => (
                      <AuthorCard
                        key={author.id}
                        author={author}
                        books={booksByAuthor[author.name.toLowerCase().trim()] ?? []}
                        featured={true}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* All Authors Grid */}
              <section aria-labelledby="all-authors" className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 id="all-authors" className="text-2xl font-bold text-gray-900">
                    All Authors
                    {filteredAuthors.length > 0 && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({filteredAuthors.length} author{filteredAuthors.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Page Size:</span>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(1); }}>
                      <SelectTrigger className="w-20 h-8 border border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 50, 100].map(size => (
                          <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredAuthors.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">No authors found</h3>
                    <p className="text-gray-400">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedAuthors.map(author => (
                      <AuthorCard
                        key={author.id}
                        author={author}
                        books={booksByAuthor[author.name.toLowerCase().trim()] ?? []}
                        featured={false}
                      />
                    ))}
                  </div>
                )}
                {filteredAuthors.length > 0 && totalPages > 1 && (
                  <div className="pagination-controls flex justify-center mt-6 space-x-2">
                    <Button variant="outline" onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1}>
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === page ? 'default' : 'outline'}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    ))}
                    <Button variant="outline" onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages}>
                      Next
                    </Button>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// Author Card Component  
interface AuthorCardProps {
  author: Author;
  books: Book[];
  featured: boolean;
}

const AuthorCard: React.FC<AuthorCardProps> = ({ author, books, featured }) => {
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuth();

  const handleMessageClick = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to message authors.',
        variant: 'destructive'
      });
      return;
    }
    setShowChat(true);
  };
  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm border-orange-200 ${featured ? 'ring-2 ring-orange-300' : ''}`}>
      <CardContent className={featured ? "p-6" : "p-4"}>
        <div className="text-center mb-4">
          <Avatar className={`${featured ? 'w-20 h-20' : 'w-16 h-16'} mx-auto mb-3 ring-2 ring-orange-200 group-hover:ring-orange-400 transition-all`}>
            <AvatarImage src={author.profile_image_url || ""} alt={author.name} />
            <AvatarFallback className={`${featured ? 'text-lg' : 'text-sm'} font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white`}>
              {getAuthorInitials(author.name)}
            </AvatarFallback>
          </Avatar>
          <h3 className={`${featured ? 'text-xl' : 'text-lg'} font-semibold text-gray-900 mb-2`}>
            {author.name}
          </h3>
          <div className="flex items-center justify-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{author.location}</span>
          </div>
          {author.bio && (
            <p className={`text-gray-600 ${featured ? 'text-sm' : 'text-xs'} line-clamp-2 mb-3`}>
              {author.bio}
            </p>
          )}
        </div>

        {/* Author Stats */}
        <div className={`grid grid-cols-2 gap-2 mb-4 ${featured ? 'text-sm' : 'text-xs'}`}>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Books
            </span>
            <span className="font-medium">{author.books_count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <Star className="w-3 h-3" />
              Rating
            </span>
            <span className="font-medium">{author.rating}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Followers
            </span>
            <span className="font-medium">{author.followers_count.toLocaleString()}</span>
          </div>
          {author.upcoming_events > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Events
              </span>
              <span className="font-medium">{author.upcoming_events}</span>
            </div>
          )}
        </div>

        {books.length > 0 && (
          <div className={`mb-4 ${featured ? 'text-sm' : 'text-xs'} text-left`}>
            <p className="font-medium text-gray-700 mb-1">Books:</p>
            <ul className="list-disc list-inside space-y-1">
              {books.slice(0, 2).map(book => (
                <li key={book.id} className="text-gray-600">{book.title}</li>
              ))}
              {books.length > 2 && (
                <li className="text-gray-500">+{books.length - 2} more</li>
              )}
            </ul>
          </div>
        )}

        {/* Genres */}
        {author.genres.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {author.genres.slice(0, featured ? 3 : 2).map((genre, index) => (
                <Badge key={index} variant="outline" className="text-xs border-orange-200 text-orange-700">
                  {genre}
                </Badge>
              ))}
              {author.genres.length > (featured ? 3 : 2) && (
                <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                  +{author.genres.length - (featured ? 3 : 2)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2">
          <Link to={`/authors/${slugify(author.name)}`}>
            <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
              View Profile
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-1">
            <ScheduleSessionDialog
              author={author}
              trigger={
                <Button variant="outline" size="sm" className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50">
                  <Clock className="w-3 h-3 mr-1" />
                  Schedule
                </Button>
              }
            />
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-green-300 text-green-700 hover:bg-green-50"
              onClick={handleMessageClick}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Message
            </Button>
            {showChat && (
              <ChatWindow
                friendId={author.id}
                isOpen={showChat}
                onClose={() => setShowChat(false)}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Authors;
