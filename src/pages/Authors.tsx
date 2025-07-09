
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, User, MapPin, Calendar, MessageSquare, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SEO from '@/components/SEO';
import { useAllLibraryBooks } from '@/hooks/useLibraryBooks';

const Authors = () => {
  const { data: books, isLoading: loading, error } = useAllLibraryBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [bookCountFilter, setBookCountFilter] = useState('');

  // Extract unique authors from books
  const authors = useMemo(() => {
    if (!books) return [];
    
    const authorMap = new Map();
    
    books.forEach(book => {
      if (book.author) {
        const authorKey = book.author.toLowerCase();
        if (!authorMap.has(authorKey)) {
          authorMap.set(authorKey, {
            name: book.author,
            bio: book.author_bio || `${book.author} is a renowned author whose works have captivated readers worldwide.`,
            books: [],
            genres: new Set<string>(),
            slug: book.author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            location: 'New York, USA', // Mock data
            upcomingEvents: Math.floor(Math.random() * 3),
            rating: (4 + Math.random()).toFixed(1),
            followers: Math.floor(Math.random() * 10000 + 1000)
          });
        }
        
        const author = authorMap.get(authorKey);
        author.books.push(book);
        if (book.genre) {
          author.genres.add(book.genre);
        }
      }
    });
    
    return Array.from(authorMap.values()).map(author => ({
      ...author,
      genres: Array.from(author.genres),
      bookCount: author.books.length
    }));
  }, [books]);

  // Get unique genres
  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    authors.forEach(author => {
      author.genres.forEach((genre: string) => genreSet.add(genre));
    });
    return Array.from(genreSet).sort();
  }, [authors]);

  // Filter authors based on search, genre, and book count
  const filteredAuthors = useMemo(() => {
    return authors.filter(author => {
      const matchesSearch = !searchTerm || 
        author.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGenre = !selectedGenre || 
        author.genres.includes(selectedGenre);
      
      const matchesBookCount = !bookCountFilter || 
        (bookCountFilter === '1-3' && author.bookCount >= 1 && author.bookCount <= 3) ||
        (bookCountFilter === '4-10' && author.bookCount >= 4 && author.bookCount <= 10) ||
        (bookCountFilter === '10+' && author.bookCount > 10);
      
      return matchesSearch && matchesGenre && matchesBookCount;
    }).sort((a, b) => b.bookCount - a.bookCount);
  }, [authors, searchTerm, selectedGenre, bookCountFilter]);

  // Featured authors (top 6 by book count)
  const featuredAuthors = useMemo(() => {
    return [...authors]
      .sort((a, b) => b.bookCount - a.bookCount)
      .slice(0, 6);
  }, [authors]);

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Authors</h1>
          <p className="text-gray-600 mb-4">Unable to load authors data: {error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Authors Directory | Sahadhyayi"
        description="Discover talented authors on Sahadhyayi. Explore biographies, books, upcoming events, and connect with writers from around the world."
        canonical="https://sahadhyayi.com/authors"
        url="https://sahadhyayi.com/authors"
      />

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Authors Directory
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover talented authors, explore their works, and connect with writers who inspire you.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Bar */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search authors by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 bg-gray-50 border-2 border-gray-200 focus:border-orange-400 rounded-xl"
                  />
                </div>
              </div>

              {/* Genre Filter */}
              <div>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-orange-400 rounded-xl">
                    <SelectValue placeholder="Filter by Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Genres</SelectItem>
                    {genres.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Book Count Filter */}
              <div>
                <Select value={bookCountFilter} onValueChange={setBookCountFilter}>
                  <SelectTrigger className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-orange-400 rounded-xl">
                    <SelectValue placeholder="Books Published" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Amount</SelectItem>
                    <SelectItem value="1-3">1-3 Books</SelectItem>
                    <SelectItem value="4-10">4-10 Books</SelectItem>
                    <SelectItem value="10+">10+ Books</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Featured Authors */}
          {featuredAuthors.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Authors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredAuthors.map(author => (
                  <Card key={author.name} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm border-orange-200">
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-orange-200 group-hover:ring-orange-400 transition-all">
                          <AvatarImage src="" alt={author.name} />
                          <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                            {getAuthorInitials(author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{author.name}</h3>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{author.location}</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {author.bio}
                        </p>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Books Published</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {author.bookCount}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Rating</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{author.rating}</span>
                            <div className="text-yellow-400">★</div>
                          </div>
                        </div>
                        {author.upcomingEvents > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Upcoming Events</span>
                            <Badge variant="outline" className="border-green-200 text-green-700">
                              <Calendar className="w-3 h-3 mr-1" />
                              {author.upcomingEvents}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <Link to={`/author/${author.slug}`}>
                          <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
                            View Profile
                          </Button>
                        </Link>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                            <Clock className="w-4 h-4 mr-1" />
                            Schedule
                          </Button>
                          <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Authors Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                All Authors
                {filteredAuthors.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filteredAuthors.length} author{filteredAuthors.length !== 1 ? 's' : ''})
                  </span>
                )}
              </h2>
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
                {filteredAuthors.map(author => (
                  <Card key={author.name} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <Avatar className="w-16 h-16 mx-auto mb-3 ring-2 ring-orange-200 group-hover:ring-orange-400 transition-all">
                          <AvatarImage src="" alt={author.name} />
                          <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                            {getAuthorInitials(author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                          {author.name}
                        </h3>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{author.location}</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                          {author.bio}
                        </p>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Books</span>
                          <span className="font-medium">{author.bookCount}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Rating</span>
                          <span className="font-medium">{author.rating} ★</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-1">
                        <Link to={`/author/${author.slug}`}>
                          <Button size="sm" className="w-full h-8 text-xs bg-orange-600 hover:bg-orange-700">
                            View Profile
                          </Button>
                        </Link>
                        <div className="grid grid-cols-2 gap-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs border-blue-300 text-blue-700">
                            Schedule
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs border-green-300 text-green-700">
                            Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Authors;
