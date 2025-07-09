
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SEO from '@/components/SEO';
import { useAllLibraryBooks } from '@/hooks/useLibraryBooks';

const Authors = () => {
  const { data: books, isLoading: loading } = useAllLibraryBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

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
            slug: book.author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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

  // Filter authors based on search, letter, and genre
  const filteredAuthors = useMemo(() => {
    return authors.filter(author => {
      const matchesSearch = !searchTerm || 
        author.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLetter = !selectedLetter || 
        author.name.toLowerCase().startsWith(selectedLetter.toLowerCase());
      
      const matchesGenre = !selectedGenre || 
        author.genres.includes(selectedGenre);
      
      return matchesSearch && matchesLetter && matchesGenre;
    });
  }, [authors, searchTerm, selectedLetter, selectedGenre]);

  // Featured authors (top 6 by book count)
  const featuredAuthors = useMemo(() => {
    return [...authors]
      .sort((a, b) => b.bookCount - a.bookCount)
      .slice(0, 6);
  }, [authors]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authors...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Authors Directory | Sahadhyayi"
        description="Discover your favorite authors on Sahadhyayi. Explore biographies, books, and more from our diverse collection of writers."
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
              Discover the brilliant minds behind your favorite books. Explore biographies, 
              works, and connect with authors who inspire you.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Bar */}
              <div className="flex-1">
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
              <div className="lg:w-64">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-200 focus:border-orange-400 rounded-xl appearance-none"
                >
                  <option value="">All Genres</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alphabet Filter */}
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-200">
              <Button
                variant={selectedLetter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLetter('')}
                className="h-8 px-3"
              >
                All
              </Button>
              {alphabet.map(letter => (
                <Button
                  key={letter}
                  variant={selectedLetter === letter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLetter(letter)}
                  className="h-8 w-8 p-0"
                >
                  {letter}
                </Button>
              ))}
            </div>
          </div>

          {/* Featured Authors */}
          {featuredAuthors.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Authors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredAuthors.map(author => (
                  <Card key={author.name} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm border-orange-200">
                    <CardContent className="p-6 text-center">
                      <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-orange-200 group-hover:ring-orange-400 transition-all">
                        <AvatarImage src="" alt={author.name} />
                        <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                          {getAuthorInitials(author.name)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{author.name}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {author.bio}
                      </p>
                      <div className="flex flex-wrap gap-1 justify-center mb-4">
                        {author.genres.slice(0, 2).map(genre => (
                          <Badge key={genre} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        {author.bookCount} book{author.bookCount !== 1 ? 's' : ''}
                      </p>
                      <Link to={`/author/${author.slug}`}>
                        <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
                          View Profile
                        </Button>
                      </Link>
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
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12 flex-shrink-0 ring-2 ring-orange-200 group-hover:ring-orange-400 transition-all">
                          <AvatarImage src="" alt={author.name} />
                          <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                            {getAuthorInitials(author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                            {author.name}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {author.bio}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {author.genres.slice(0, 1).map(genre => (
                              <Badge key={genre} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                {genre}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mb-3">
                            {author.bookCount} book{author.bookCount !== 1 ? 's' : ''}
                          </p>
                          <Link to={`/author/${author.slug}`}>
                            <Button size="sm" className="w-full h-8 text-xs bg-orange-600 hover:bg-orange-700">
                              View Profile
                            </Button>
                          </Link>
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
