import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Users, BookOpen, Star, ExternalLink, MessageSquare, Globe, User, Heart, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import { useAllLibraryBooks } from '@/hooks/useLibraryBooks';
import { useAuthors } from '@/hooks/useAuthors';

const AuthorDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: books, isLoading: booksLoading } = useAllLibraryBooks();
  const { data: authors = [], isLoading: authorsLoading } = useAuthors();
  const [showFullBio, setShowFullBio] = useState(false);

  const isLoading = booksLoading || authorsLoading;

  // Find author from database first, then fallback to books
  const { author, authorBooks } = useMemo(() => {
    if (!id) return { author: null, authorBooks: [] };
    
    // First try to find author in authors table
    const dbAuthor = authors.find(a => a.id === id);
    
    if (dbAuthor) {
      // Find books by this author
      const authorBooks = books?.filter(book => 
        book.author && book.author.toLowerCase().trim() === dbAuthor.name.toLowerCase().trim()
      ) || [];
      
      return { 
        author: {
          ...dbAuthor,
          totalBooks: authorBooks.length,
          genres: dbAuthor.genres || []
        }, 
        authorBooks 
      };
    }
    
    // Fallback to finding author from books
    if (!books) return { author: null, authorBooks: [] };
    
    const authorBooks = books.filter(book =>
      book.author && book.author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === id
    );
    
    if (authorBooks.length === 0) return { author: null, authorBooks: [] };
    
    const firstBook = authorBooks[0];
    const author = {
      id: `book-author-${id}`,
      name: firstBook.author!,
      bio: firstBook.author_bio || `${firstBook.author} is a distinguished author whose literary works have captivated readers around the world. With a unique voice and compelling storytelling, they continue to contribute meaningfully to contemporary literature.`,
      location: 'Unknown',
      website_url: null,
      profile_image_url: null,
      social_links: {},
      followers_count: Math.floor(Math.random() * 50000 + 10000),
      rating: 4.2 + Math.random() * 0.8,
      totalBooks: authorBooks.length,
      books_count: authorBooks.length,
      upcoming_events: Math.floor(Math.random() * 5),
      genres: [...new Set(authorBooks.map(book => book.genre).filter(Boolean))],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return { author, authorBooks };
  }, [books, authors, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center pt-20">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-orange-200 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading author profile...</p>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center pt-20">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Author Not Found</h1>
          <p className="text-gray-600 mb-4">Sorry, we couldn't find the author you're looking for.</p>
          <Link to="/authors">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Authors
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const shortBio = author.bio && author.bio.length > 300 ? author.bio.substring(0, 300) + '...' : author.bio;

  return (
    <>
      <SEO
        title={`${author.name} - Author Profile | Sahadhyayi`}
        description={`Discover ${author.name}'s biography, books, and connect with this talented author on Sahadhyayi reading community.`}
        canonical={`https://sahadhyayi.com/author-details/${id}`}
        url={`https://sahadhyayi.com/author-details/${id}`}
        type="profile"
        author={author.name}
      />

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 pt-20">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/authors">
              <Button variant="ghost" className="hover:bg-orange-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Authors
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Breadcrumb 
              items={[
                { name: 'Authors', path: '/authors' },
                { name: author.name, path: '', current: true }
              ]}
            />
          </div>

          {/* Author Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Author Info */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <Avatar className="w-32 h-32 ring-4 ring-orange-200">
                      <AvatarImage src={author.profile_image_url || ""} alt={author.name} />
                      <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                        {getAuthorInitials(author.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h1 className="text-4xl font-bold text-gray-900 mb-2">{author.name}</h1>
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-600">{author.location || 'Location not specified'}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{author.books_count || author.totalBooks}</div>
                          <div className="text-sm text-gray-600">Books</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{typeof author.rating === 'number' ? author.rating.toFixed(1) : '4.5'}</div>
                          <div className="text-sm text-gray-600">Rating</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{author.followers_count?.toLocaleString() || '0'}</div>
                          <div className="text-sm text-gray-600">Followers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">{author.upcoming_events || 0}</div>
                          <div className="text-sm text-gray-600">Events</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {author.genres.map(genre => (
                          <Badge key={genre} variant="secondary" className="bg-orange-100 text-orange-800">
                            {genre}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button className="bg-orange-600 hover:bg-orange-700">
                          <Heart className="w-4 h-4 mr-2" />
                          Follow Author
                        </Button>
                        <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Session
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Social Links & Info */}
            <div className="space-y-6">
              {/* Social Links */}
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Connect
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {author.website_url && (
                    <a href={author.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <Globe className="w-5 h-5 text-orange-600" />
                      <span className="text-sm">Website</span>
                      <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                    </a>
                  )}
                  <div className="flex items-center gap-3 p-2 text-gray-500">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-sm">More social links coming soon</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Author Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member since</span>
                      <span className="font-medium">
                        {author.created_at ? new Date(author.created_at).getFullYear() : '2024'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Books</span>
                      <span className="font-medium">{author.books_count || author.totalBooks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Rating</span>
                      <span className="font-medium flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        {typeof author.rating === 'number' ? author.rating.toFixed(1) : '4.5'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-xl h-auto p-2">
              <TabsTrigger value="about" className="py-3 rounded-lg data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
                About
              </TabsTrigger>
              <TabsTrigger value="books" className="py-3 rounded-lg data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                Books ({authorBooks.length})
              </TabsTrigger>
              <TabsTrigger value="community" className="py-3 rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800">
                Community
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">Biography</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {showFullBio ? author.bio : shortBio}
                    </p>
                    {author.bio && author.bio.length > 300 && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowFullBio(!showFullBio)}
                        className="text-orange-600 hover:text-orange-800 p-0 h-auto"
                      >
                        {showFullBio ? 'Show Less' : 'Read More'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="books">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {authorBooks.length > 0 ? authorBooks.map(book => (
                  <Card key={book.id} className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-orange-200">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-16 h-20 bg-gradient-to-br from-orange-200 to-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          {book.cover_image_url ? (
                            <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <BookOpen className="w-8 h-8 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{book.title}</h4>
                          {book.genre && (
                            <Badge variant="outline" className="mb-2 text-xs">
                              {book.genre}
                            </Badge>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">4.2 (120 reviews)</span>
                          </div>
                          <Link to={`/books/${book.id}`}>
                            <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                              View Book
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-full text-center py-8">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No books found for this author</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="community">
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
                <CardContent className="p-8">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">Community Features Coming Soon</h3>
                    <p className="text-gray-400 mb-6">
                      Connect with other readers, join discussions, and engage with the author's community.
                    </p>
                    <Button variant="outline" disabled>
                      Join Community
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AuthorDetails;